import React from 'react';

import Wrapper from 'layout/wrapper';

import BANNER_1_IMG from 'images/home-banner/banner-1.png';
import BANNER_2_IMG from 'images/home-banner/banner-2.png';
import BANNER_3_IMG from 'images/home-banner/banner-3.png';

export interface HomeBannerProps {

}

const claimLines = [{ id: '0', text: 'free and open' }, { id: '1', text: 'flexible' }, { id: '2', text: 'efficient & repitable' }];

export const HomeBanner: React.FC<HomeBannerProps> = () => {
  return (
    <div className="py-32 bg-gray-500" style={{ background: 'radial-gradient(circle at 50% 60%, rgba(54,55,62,1) 0%, rgba(17,17,17,1) 51%)' }}>

      <Wrapper>
        <div className="flex flex-col items-center space-y-44 md:space-y-20">
          <div>
            <h5 className="text-6xl leading-10 font-heading">Marxan software is</h5>
            <div
              className="relative h-40"
              style={{ clipPath: 'polygon(0 5%, 100% 5%, 100% 45%, 0 45%)' }}
            >
              <div className="absolute flex flex-col items-center w-full max-w-4xl animate-banner text-primary-500">
                {!!claimLines.length && claimLines.map((cl) => (
                  <p className="mb-16 text-5xl" key={cl.id}>{cl.text}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="relative grid justify-between w-full grid-cols-1 px-20 md:px-0 md:grid-cols-3 gap-y-24 md:gap-y-0 md:gap-x-6">

            <img alt="Scenario features example" src={BANNER_1_IMG} />
            <img alt="Scenario map layers example" src={BANNER_2_IMG} />
            <img alt="Scenarios tags examples" src={BANNER_3_IMG} className="pt-12" />

          </div>
        </div>
      </Wrapper>
    </div>
  );
};

export default HomeBanner;
