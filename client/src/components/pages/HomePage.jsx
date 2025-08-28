import React from 'react'
import HeroSection from '../HeroSection'
import Footer from '../Footer'
import Navbar from '../Navbar'

const HomePage = () => {
  return (
    <div>
      <Navbar/>
        <HeroSection/>
        <Footer/>
    </div>
  )
}

export default HomePage