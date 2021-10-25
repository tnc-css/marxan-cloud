import React, { useCallback, useEffect, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';

import { useSignUpConfirmation } from 'hooks/me';

import Wrapper from 'layout/wrapper';

import Button from 'components/button';

export interface SignUpConfirmationProps {
}

export const SignUpConfirmation: React.FC<SignUpConfirmationProps> = () => {
  const { push, query: { token: confirmToken } } = useRouter();
  const [confirmAccountToken, setConfirmAccountToken] = useState(false);
  const confirmationAccountMutation = useSignUpConfirmation({});

  const confirmAccount = useCallback(() => {
    const data = { confirmToken };
    confirmationAccountMutation.mutate({ data }, {
      onSuccess: () => {
        setConfirmAccountToken(true);
      },
      onError: () => {
        setConfirmAccountToken(false);
      },
    });
  }, [confirmationAccountMutation, confirmToken]);

  useEffect(() => {
    confirmAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmToken]);

  return (
    <Wrapper>
      {confirmAccountToken && (
        <div className="relative flex items-center justify-center h-full">
          <div className="w-full max-w-xs">
            <div className="pb-5">
              <h2 className="mb-24 text-lg font-medium text-center text-gray-600 font-heading">
                Welcome to Marxan!
                <br />
                You&apos;ve create an account
              </h2>
            </div>
            <div className="mt-10">
              <Button
                theme="tertiary"
                size="lg"
                type="submit"
                onClick={() => push('/auth/sign-in')}
                className="w-full"
              >
                Sign in
              </Button>
            </div>
          </div>
        </div>
      )}

      {!confirmAccountToken && (
        <div className="relative flex items-center justify-center h-full">
          <div className="w-full max-w-xs">
            <div className="flex flex-col items-center pb-5 space-y-20">
              <h2 className="text-lg font-medium text-center text-gray-600 font-heading">
                Sorry, it seems that you have not created an account.
              </h2>
              <p className="mb-12 text-sm text-gray-500">
                You can
                {' '}

                <Link href="/auth/sign-up">
                  <a href="/auth/sign-up" className="text-black underline hover:no-underline">create an account.</a>
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </Wrapper>
  );
};

export default SignUpConfirmation;