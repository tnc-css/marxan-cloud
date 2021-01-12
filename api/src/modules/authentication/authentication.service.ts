import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from 'modules/users/user.entity';
import { UsersService } from 'modules/users/users.service';
import { AppConfig } from 'utils/config.utils';
import { hash, compare } from 'bcrypt';

import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { IssuedAuthnToken } from './issued-authn-token.entity';

/**
 * Access token for the app: key user data and access token
 */
export interface AccessToken {
  /**
   * Whitelisted user metadata
   */
  user: Partial<User>;

  /**
   * Signed JWT
   */
  accessToken: string;
}

/**
 * JWT payload
 */
export interface JwtAppPayload {
  /**
   * Username (user email address).
   */
  sub: string;

  /**
   * Unique id of the JWT token.
   *
   * This is used to check tokens presented to the API against revoked tokens.
   */
  tokenId: string;

  /**
   * Issued At: epoch timestamp in seconds, UTC.
   */
  iat: number;

  /**
   * Expiration time: epoch timestamp in seconds, UTC.
   */
  exp: number;
}

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(IssuedAuthnToken)
    private readonly issuedAuthnTokensRepository: Repository<IssuedAuthnToken>,
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  /**
   * Validate that an active user matching the `email` provided exists, and that
   * the password provided compares with the hashed password stored for the
   * user.
   */
  async validateUser({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    const isUserActive = user && user.isActive && !user.isDeleted;

    if (user && isUserActive && (await compare(password, user.passwordHash))) {
      return user;
    }
    return null;
  }

  /**
   * Create a new user from the signup data provided.
   *
   * @todo Allow to set all of a user's data on signup
   * @todo Implement email verification
   */
  async createUser(signupDto: { username: string; password: string }) {
    const user = new User();
    user.passwordHash = await hash(signupDto.password, 10);
    user.email = signupDto.username;
    this.usersRepository.save(user);
  }

  /**
   * Issue a signed JTW token, logging its creation.
   */
  async login(user: Partial<User>): Promise<AccessToken> {
    const payload = { sub: user.email };
    /**
     * We generate a signed token twice. The first one is used only to read the
     * `exp` timestamp generated by the JWT service.
     *
     * We then store a record of the token which is going to be issued, using
     * the `exp` timestamp above as an approximation of the actual timestamp of
     * the real token. This is an approximation as there will be a (normally
     * tiny) temporal gap between the generation of the first and the second
     * token.
     *
     * As an aside, we could obviously use `moment` or other time calculation
     * methods here to figure out an `exp` value, but the value we get here is
     * good enough for the intended use (enabling to purge records of expired
     * tokens) without introducing further dependencies or complexity.
     */
    const intermediateToken = this.jwtService.sign(payload, {
      expiresIn: AppConfig.get('auth.jwt.expiresIn', '2h'),
    });

    if (!intermediateToken) {
      throw new InternalServerErrorException(
        'Error during generation of JWT token',
      );
    }

    const intermediateTokenData = this.jwtService.decode(intermediateToken);

    if (!intermediateTokenData || typeof intermediateTokenData !== 'object') {
      throw new InternalServerErrorException(
        'Error during generation of JWT token',
      );
    }

    const tokenRecord = new IssuedAuthnToken();
    // I am not sure this is kosher. In practice, we should always have an exp
    // string here, and it should be always an epoch. In practice, it may be
    // a good idea to actually check (via an accessory function).
    tokenRecord.exp = new Date(Number(intermediateTokenData['exp']) * 1e3);
    tokenRecord.userId = user.id as string;
    const actualTokenRecord = await this.issuedAuthnTokensRepository.save(
      tokenRecord,
    );

    /**
     * We finally use the db-generated unique id of the token record to compose
     * the payload of the actual token. This can later be used to check that a
     * token being presented by an API client was not revoked (this is done by
     * deleting the corresponding record).
     */
    return {
      user: this.usersService.getSanitizedUserMetadata(user),
      accessToken: this.jwtService.sign(
        { ...payload, tokenId: actualTokenRecord.id },
        {
          expiresIn: AppConfig.get('auth.jwt.expiresIn', '2h'),
        },
      ),
    };
  }

  /**
   * Find token by id in the log of issued tokens.
   *
   * See documentation of the IssuedAuthnToken entity for details on these ids.
   */
  async findTokenById(tokenId: string): Promise<IssuedAuthnToken | undefined> {
    return this.issuedAuthnTokensRepository.findOne({ id: tokenId });
  }
}
