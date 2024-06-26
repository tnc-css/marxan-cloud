import React, { useCallback, useState } from 'react';

import { Form as FormRFF, Field as FieldRFF } from 'react-final-form';

import Link from 'next/link';

import omit from 'lodash/omit';
import { usePlausible } from 'next-plausible';

import { useToasts } from 'hooks/toast';

import Button from 'components/button';
import Checkbox from 'components/forms/checkbox';
import Field from 'components/forms/field';
import Input from 'components/forms/input';
import Label from 'components/forms/label';
import Select from 'components/forms/select';
import {
  composeValidators,
  booleanValidator,
  passwordStrengthValidator,
} from 'components/forms/validations';
import InfoButton from 'components/info-button';
import Loading from 'components/loading';
import ConfirmSignUp from 'layout/sign-up/confirm';
import Wrapper from 'layout/wrapper';

import AUTHENTICATION from 'services/authentication';

import EMAIL_SVG from 'svgs/ui/email.svg?sprite';
import LOCATION_SVG from 'svgs/ui/location.svg?sprite';
import PASSWORD_SVG from 'svgs/ui/password.svg?sprite';
import USER_SVG from 'svgs/ui/user.svg?sprite';

import { BACKGROUND_OPTIONS, ACADEMIC_LEVEL_OPTIONS, APPLIED_LEVEL_OPTIONS } from './constants';
import PasswordStrenght from './password-strenght';

export interface SignUpProps {}

export const SignUp: React.FC<SignUpProps> = () => {
  const { addToast } = useToasts();
  const plausible = usePlausible();
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleSubmit = useCallback(
    async (data) => {
      setSubmitting(true);

      try {
        const signUpResponse = await AUTHENTICATION.request({
          method: 'POST',
          url: '/sign-up',
          data: omit(data, 'checkbox'),
        });
        // There is an inconsistency on the API
        // where username is used for log in instead of email
        if (signUpResponse.status === 201) {
          setConfirm(true);
          plausible('Sign up', {
            props: {
              userEmail: `${data.email}`,
            },
          });
        }
      } catch (error) {
        const {
          data: { errors },
        } = error.response;

        addToast(
          'error-signup',
          <>
            <h2 className="font-medium">Error!</h2>
            <ul>
              {errors.map(({ title }) => (
                <li key={title}>
                  <p className="text-sm">Ooops! Something went wrong. Try again</p>
                </li>
              ))}
            </ul>
          </>,
          {
            level: 'error',
          }
        );

        setSubmitting(false);
      }
    },
    [addToast, plausible]
  );

  return (
    <Wrapper>
      {!confirm && (
        <FormRFF onSubmit={handleSubmit}>
          {(props) => (
            <form
              onSubmit={props.handleSubmit}
              autoComplete="off"
              className="relative flex h-full items-center justify-center"
            >
              <div className="w-full max-w-xs">
                <h2 className="mb-5 text-center font-heading text-lg font-medium text-gray-700">
                  Get Started!
                </h2>

                <Loading
                  visible={submitting}
                  className="absolute bottom-0 left-0 right-0 top-0 z-40 flex h-full w-full items-center justify-center bg-white bg-opacity-90"
                  iconClassName="w-10 h-10 text-primary-500"
                />

                {/* DISPLAY NAME */}
                <div>
                  <FieldRFF name="displayName" validate={composeValidators([{ presence: true }])}>
                    {(fprops) => (
                      <Field id="login-displayName" {...fprops}>
                        <Label theme="light" className="mb-3 uppercase">
                          Name
                        </Label>
                        <Input theme="light" icon={USER_SVG} />
                      </Field>
                    )}
                  </FieldRFF>
                </div>

                {/* COUNTRY */}
                <div className="mt-5">
                  <FieldRFF name="country" validate={composeValidators([{ presence: true }])}>
                    {(fprops) => (
                      <Field id="login-country" {...fprops}>
                        <Label theme="light" className="mb-3 uppercase">
                          Country
                        </Label>
                        <Input theme="light" icon={LOCATION_SVG} />
                      </Field>
                    )}
                  </FieldRFF>
                </div>

                {/* BACKGROUND */}
                <div className="mt-5">
                  <FieldRFF name="background" validate={composeValidators([{ presence: true }])}>
                    {(fprops) => (
                      <Field id="login-background" {...fprops} className="w-full">
                        <Label theme="light" className="mb-3 uppercase">
                          What is the nature of your work with Marxan?
                        </Label>
                        <Select
                          theme="light-square"
                          size="base"
                          placeholder="Select..."
                          options={BACKGROUND_OPTIONS}
                          onChange={fprops.input.onChange}
                        />
                      </Field>
                    )}
                  </FieldRFF>
                </div>

                {/* LEVEL */}
                <div className="mt-5">
                  <FieldRFF name="level" validate={composeValidators([{ presence: true }])}>
                    {(fprops) => (
                      <Field id="login-level" {...fprops} className="w-full">
                        <Select
                          theme="light-square"
                          size="base"
                          placeholder="Select..."
                          options={
                            props.values.background === 'academic_research'
                              ? ACADEMIC_LEVEL_OPTIONS
                              : APPLIED_LEVEL_OPTIONS
                          }
                          onChange={fprops.input.onChange}
                        />
                      </Field>
                    )}
                  </FieldRFF>
                </div>

                {/* EMAIL */}
                <div className="mt-5">
                  <FieldRFF
                    name="email"
                    validate={composeValidators([{ presence: true, email: true }])}
                  >
                    {(fprops) => (
                      <Field id="login-username" {...fprops}>
                        <Label theme="light" className="mb-3 uppercase">
                          Email
                        </Label>
                        <Input theme="light" type="email" icon={EMAIL_SVG} />
                      </Field>
                    )}
                  </FieldRFF>
                </div>

                {/* PASSWORD */}
                <div className="mt-5">
                  <FieldRFF
                    name="password"
                    validate={composeValidators([passwordStrengthValidator])}
                  >
                    {(fprops) => (
                      <Field id="login-password" {...fprops}>
                        <div className="mb-3 flex items-center space-x-3">
                          <Label theme="light" className="uppercase">
                            Password
                          </Label>
                          <InfoButton theme="secondary" size="s">
                            <span className="text-xs">
                              <p>
                                To sign-up, you need to create a strong password. The visual
                                guidance below the password field should be green for the system to
                                accept the password
                              </p>
                            </span>
                          </InfoButton>
                        </div>
                        <Input theme="light" type="password" icon={PASSWORD_SVG} />
                      </Field>
                    )}
                  </FieldRFF>

                  <PasswordStrenght password={props.values.password} />
                </div>

                <div className="mt-7">
                  <FieldRFF
                    name="checkbox"
                    type="checkbox"
                    validate={composeValidators([booleanValidator])}
                  >
                    {(fprops) => (
                      <Field className="mt-2 flex" id="form-checkbox" {...fprops}>
                        <Checkbox theme="light" />
                        <Label theme="light" className="-mt-1 ml-2 font-sans text-xs">
                          This site is managed by The Nature Conservancy.
                          <br />
                          By submitting your information, you agree to The Nature Conservancy’s{' '}
                          <a
                            className="underline hover:no-underline"
                            href="https://www.nature.org/en-us/about-us/who-we-are/accountability/terms-of-use"
                            rel="noreferrer"
                            target="_blank"
                          >
                            Terms of Service
                          </a>{' '}
                          and{' '}
                          <a
                            className="underline hover:no-underline"
                            href="https://www.nature.org/en-us/about-us/who-we-are/accountability/privacy-policy"
                            rel="noreferrer"
                            target="_blank"
                          >
                            Privacy Statement.
                          </a>
                        </Label>
                      </Field>
                    )}
                  </FieldRFF>
                </div>

                <div className="mt-10">
                  <Button
                    theme="primary"
                    size="lg"
                    type="submit"
                    disabled={submitting}
                    className="w-full"
                  >
                    Sign up
                  </Button>
                </div>

                <div className="mt-5 text-center text-sm text-black">
                  Already registered.{' '}
                  <Link href="/auth/sign-in" className="underline">
                    Sign in
                  </Link>
                </div>
              </div>
            </form>
          )}
        </FormRFF>
      )}
      {confirm && <ConfirmSignUp setConfirm={setConfirm} />}
    </Wrapper>
  );
};

export default SignUp;
