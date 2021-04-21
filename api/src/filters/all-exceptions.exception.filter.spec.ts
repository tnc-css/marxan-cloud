import { AllExceptionsFilter } from './all-exceptions.exception.filter';
import { HttpException, ArgumentsHost, HttpStatus } from '@nestjs/common';

describe('AllExceptionFilter class spec (unit)', () => {
  const allExceptionsFilter = new AllExceptionsFilter();

  /**
   * Common Mocks
   */
  const responseMock = {
    status: jest.fn(function () {
      return this;
    }),
    json: jest.fn(),
    url: 'fakeUrl',
  };

  const hostMock = {
    switchToHttp: () => {
      return {
        getResponse: () => responseMock,
        getRequest: () => {
          return { url: 1 };
        },
      };
    },
  } as ArgumentsHost;
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(new AllExceptionsFilter()).toBeDefined();
  });

  it('should get HTTP status through exception Object', () => {
    const exceptionObjectMock = ({
      getStatus: jest.fn(() => 404),
      message: 'Mock Message',
      stack: 'Fake Error Stack',
    } as unknown) as HttpException;

    /**
     * Prototype pollution to mock 'instanceof'
     */
    const exception = Object.create(HttpException.prototype);
    const exceptionMock = Object.assign(exception, exceptionObjectMock);

    allExceptionsFilter.catch(exception, hostMock);

    expect(responseMock.status).toHaveBeenCalledWith(exceptionMock.getStatus());
    expect(responseMock.json).toHaveBeenCalled();
  });

  it('should get HTTP status through HttpStatus', () => {
    const exceptionMock = ({
      message: 'Mock Message',
      stack: 'Fake Error Stack',
    } as unknown) as Error;
    allExceptionsFilter.catch(exceptionMock, hostMock);

    expect(responseMock.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(responseMock.json).toHaveBeenCalled();
  });
});
