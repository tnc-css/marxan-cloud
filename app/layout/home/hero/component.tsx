import React from 'react';

import Link from 'next/link';

import Wrapper from 'layout/wrapper';

import Button from 'components/button';

import ARROW_DOWN_SVG from 'svgs/ui/arrow-down.svg?sprite';

import HeroAnimation, { BACKGROUND_IMAGES } from './hero-animation';

export interface HomeHeroProps {

}

export const HomeHero: React.FC<HomeHeroProps> = () => {
  const { backgroundColor } = BACKGROUND_IMAGES[0];

  return (
    <div
      className="relative text-white w-full md:h-screen min-h-screen flex items-center pt-24 md:pt-0"
      style={{ backgroundColor }}
    >
      <HeroAnimation />
      <Wrapper>
        <div className="relative flex flex-col justify-between max-w-5xl z-10 w-full h-full m-auto py-8 md:py-0 md:mt-64 md:mb-48">
          <div className="lg:pr-96">
            <h1
              className="pb-8 text-5xl font-semibold leading-tight"
            >
              Spatial conservation planning in the cloud
            </h1>

            <p className="md:pr-40">
              This platform supports decision-making for biodiversity
              {' '}
              and people on land, freshwater and ocean systems.
            </p>

            <div className="space-y-4 xs:flex xs:space-x-4 xs:space-y-0 mt-10 md:mt-18 md:mb-18">
              <Button
                className="w-full md:w-40"
                theme="primary"
                size="lg"
                href="/projects"
              >
                Get started
              </Button>

              <Button
                className="w-full md:w-40"
                theme="secondary"
                size="lg"
              >
                How to
              </Button>
            </div>
          </div>

          <div className="relative md:absolute bottom-0 mt-10 md:mt-0 text-center md:text-left">
            <Link href="#features">
              <a className="mt-8" href="#features">
                Scroll down
                <ARROW_DOWN_SVG className="inline w-3 ml-3" fill="white" />
              </a>
            </Link>
          </div>
        </div>
      </Wrapper>
    </div>
  );
};

export default HomeHero;
