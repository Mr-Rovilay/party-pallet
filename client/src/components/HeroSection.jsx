/* eslint-disable no-unused-vars */
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Calendar, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-brown-900 to-brown-700 text-cream">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gold/10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-cream/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-brown-600/20 blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-6 z-10 py-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Content */}
          <motion.div 
            className="md:w-1/2 mb-12 md:mb-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-brown-800/60 backdrop-blur-sm px-4 py-2 rounded-full mb-6"
            >
              <Sparkles className="text-gold" size={18} />
              <span className="text-sm font-medium">Creating Magical Moments</span>
            </motion.div>
            
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 font-serif"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
            >
              Transform Your <span className="text-gold">Celebrations</span> Into Unforgettable Experiences
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl mb-10 max-w-lg text-cream/90"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.7 }}
            >
              Expert decoration services for birthdays, bridal showers, and special events. 
              Let us bring your vision to life with our elegant designs and attention to detail.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.7 }}
            >
              <Link to="/booking">
                <Button 
                  size="lg" 
                  className="bg-gold hover:bg-gold/90 text-brown-900 font-semibold flex items-center gap-2 group"
                >
                  Book Your Event
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </Link>
              
              <Link to="/portfolio">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-cream text-cream hover:bg-cream hover:text-brown-900 font-semibold flex items-center gap-2"
                >
                  <Calendar size={18} />
                  View Our Work
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Image */}
          <motion.div 
            className="md:w-2/5 relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-gold/20 rounded-2xl blur-xl"></div>
              <div className="relative bg-brown-800/30 backdrop-blur-sm border border-cream/10 rounded-2xl overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Elegant party decoration" 
                  className="w-full h-auto rounded-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brown-900/70 to-transparent"></div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div 
              className="absolute -top-6 -right-6 bg-gold text-brown-900 rounded-full p-4 shadow-lg"
              animate={{ y: [0, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Sparkles size={24} />
            </motion.div>
            
            <motion.div 
              className="absolute -bottom-6 -left-6 bg-cream text-brown-900 rounded-full p-4 shadow-lg"
              animate={{ y: [0, 15, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            >
              <Calendar size={24} />
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      >
        <div className="w-8 h-12 rounded-full border-2 border-cream/30 flex justify-center p-1">
          <div className="w-2 h-2 bg-cream rounded-full animate-bounce"></div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;