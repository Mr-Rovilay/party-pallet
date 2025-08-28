import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Instagram, 
  Facebook, 
  Twitter, 
  ChevronRight
} from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    {
      title: "Quick Links",
      links: [
        { name: "Home", path: "/" },
        { name: "About Us", path: "/about" },
        { name: "Services", path: "/services" },
        { name: "Rentals", path: "/rentals" },
        { name: "Portfolio", path: "/portfolio" },
        { name: "Booking", path: "/booking" },
      ]
    },
    {
      title: "Services",
      links: [
        { name: "Birthday Decorations", path: "/services#birthdays" },
        { name: "Bridal Showers", path: "/services#bridal" },
        { name: "Baby Showers", path: "/services#baby" },
        { name: "Hall Decorations", path: "/services#hall" },
        { name: "Home Decorations", path: "/services#home" },
        { name: "Event Rentals", path: "/rentals" },
      ]
    },
    {
      title: "Contact Us",
      links: [
        { 
          name: "Lagos, Nigeria", 
          path: "#", 
          icon: <MapPin size={16} className="mr-2" /> 
        },
        { 
          name: "+234 123 456 7890", 
          path: "tel:+2341234567890", 
          icon: <Phone size={16} className="mr-2" /> 
        },
        { 
          name: "info@partypallet.com", 
          path: "mailto:info@partypallet.com", 
          icon: <Mail size={16} className="mr-2" /> 
        },
      ]
    }
  ];

  const socialLinks = [
    { name: "Instagram", icon: <Instagram size={20} />, path: "https://instagram.com/partypallet" },
    { name: "Facebook", icon: <Facebook size={20} />, path: "https://facebook.com/partypallet" },
    { name: "Twitter", icon: <Twitter size={20} />, path: "https://twitter.com/partypallet" },
    // { name: "TikTok", icon: <TikTok size={20} />, path: "https://tiktok.com/@partypallet" },
  ];

  return (
    <footer className="bg-brown-900 text-cream pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link to="/" className="inline-block mb-6">
              <h2 className="text-3xl font-script text-gold">Party Pallet</h2>
            </Link>
            <p className="mb-6 text-cream/80 max-w-xs">
              Creating magical moments with elegant decorations for all your special occasions. 
              Transforming spaces into unforgettable experiences.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={index}
                  href={social.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-brown-800 flex items-center justify-center text-cream hover:bg-gold hover:text-brown-900 transition-colors duration-300"
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Links Columns */}
          {footerLinks.map((column, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <h3 className="text-xl font-semibold mb-6 text-gold">{column.title}</h3>
              <ul className="space-y-3">
                {column.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      to={link.path}
                      className="flex items-start text-cream/80 hover:text-gold transition-colors duration-300 group"
                    >
                      {link.icon || <ChevronRight size={16} className="mr-2 mt-1 flex-shrink-0" />}
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="pt-8 border-t border-brown-800 flex flex-col md:flex-row justify-between items-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <p className="text-cream/60 text-sm mb-4 md:mb-0">
            &copy; {currentYear} Party Pallet. All rights reserved.
          </p>
          <div className="flex space-x-6 text-sm">
            <Link to="/privacy" className="text-cream/60 hover:text-gold transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-cream/60 hover:text-gold transition-colors duration-300">
              Terms of Service
            </Link>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;