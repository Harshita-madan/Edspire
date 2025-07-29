import React from 'react'

import {Swiper, SwiperSlide} from "swiper/react"
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';




import Course_Card from './Course_Card'

const CourseSlider = ({Courses}) => {
  return (
    <>
      {Courses?.length ? (
        <Swiper
          // slidesPerView={1}
          // spaceBetween={25}
          // // loop={true}
          // modules={[FreeMode, Pagination]}
          // breakpoints={{
          //   1024: {
          //     slidesPerView: 3,
          //   },
          // // pagination={true} modules={[Pagination]}
          // }}
          spaceBetween={30}
          // centeredSlides={true}
          slidesPerView={2}  // Number of slides visible at once
          // spaceBetween={30}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
            reverseDirection: false,
          }}
          pagination={{
            clickable: true,
          }}
          navigation={true}
          modules={[Autoplay, Pagination, Navigation]}
          className="mySwiper"
        >
          {Courses?.map((course, i) => (
            <SwiperSlide key={i}>
              <Course_Card course={course} Height={"h-[300px]"} />
            </SwiperSlide>
          ))}
        </Swiper>
      ) : (
        <p className="text-xl text-richblack-5">No Course Found</p>
      )}
    </>
  )
}

export default CourseSlider