import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Package, Star, DollarSign, 
  Calendar, MapPin, Phone, Mail, Heart, ShoppingCart
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  getRentals, 
  getFeaturedRentals, 
  getRentalCategories,
  selectAllRentals,
  selectFeaturedRentals,
  selectRentalCategories,
  selectRentalStatus,
  selectRentalError
} from '@/redux/slice/rentalSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import Navbar from '../Navbar';

// Categories from the model
const RENTAL_CATEGORIES = [
  "Decorations", 
  "Furniture", 
  "Lighting", 
  "Tableware", 
  "Other"
];

const PublicRentalsPage = () => {
  const dispatch = useDispatch();
  const rentals = useSelector(selectAllRentals);
  const featuredRentals = useSelector(selectFeaturedRentals);
  const rentalCategories = useSelector(selectRentalCategories);
  const status = useSelector(selectRentalStatus);
  const error = useSelector(selectRentalError);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [inquiryDialogOpen, setInquiryDialogOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    message: ''
  });

  // Fetch rentals and categories on component mount
  useEffect(() => {
    dispatch(getRentals({ active: true, inStock: true }));
    dispatch(getFeaturedRentals());
    dispatch(getRentalCategories());
  }, [dispatch]);

  // Handle form input changes
  const handleInquiryChange = (e) => {
    const { name, value } = e.target;
    setInquiryForm({
      ...inquiryForm,
      [name]: value
    });
  };

  // Open inquiry dialog
  const openInquiryDialog = (rental) => {
    setSelectedRental(rental);
    setInquiryDialogOpen(true);
  };

  // Submit inquiry
  const handleInquirySubmit = (e) => {
    e.preventDefault();
    
    // Here you would typically send the inquiry to your backend
    // For now, we'll just show a success message
    toast.success('Inquiry sent successfully! We will contact you soon.');
    setInquiryDialogOpen(false);
    setInquiryForm({
      name: '',
      email: '',
      phone: '',
      eventDate: '',
      message: ''
    });
    setSelectedRental(null);
  };

  // Filter and sort rentals
  const filteredRentals = rentals
    .filter(rental => {
      const matchesSearch = searchTerm === '' || 
        rental.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || rental.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'price') {
        return sortOrder === 'asc' ? a.basePrice - b.basePrice : b.basePrice - a.basePrice;
      } else if (sortBy === 'name') {
        return sortOrder === 'asc' 
          ? a.name.localeCompare(b.name) 
          : b.name.localeCompare(a.name);
      } else {
        // Default sort by createdAt
        return sortOrder === 'asc' 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-brown-900 to-brown-700 text-cream py-20 px-4">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-gold/10 blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-72 h-72 rounded-full bg-cream/10 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto text-center relative z-10 px-6">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6 font-serif"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Premium <span className="text-gold">Event Rentals</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl max-w-2xl mx-auto mb-10 text-cream/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Elevate your events with our exquisite collection of rental items. From decorations to furniture, we have everything you need.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gold hover:bg-gold/90 text-brown-900 font-semibold"
                onClick={() => document.getElementById('rentals-section').scrollIntoView({ behavior: 'smooth' })}
              >
                Browse Rentals
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-cream text-cream hover:bg-cream hover:text-brown-900"
              >
                Contact Us
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Rentals */}
      {featuredRentals.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-brown mb-4 font-serif">Featured Rentals</h2>
              <p className="text-brown/60 max-w-2xl mx-auto">
                Check out our most popular rental items that are perfect for making your event memorable.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredRentals.map((rental, index) => (
                <motion.div
                  key={rental._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg h-full flex flex-col">
                    <div className="relative h-56 overflow-hidden">
                      {rental.images && rental.images.length > 0 ? (
                        <img 
                          src={rental.images[0].url} 
                          alt={rental.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brown-100 flex items-center justify-center">
                          <Package className="text-brown-300" size={48} />
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-gold text-brown-900">
                          <Star size={12} className="mr-1" />
                          Featured
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl text-brown">{rental.name}</CardTitle>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-brown border-brown/30">
                          {rental.category}
                        </Badge>
                        <span className="text-lg font-bold text-gold">
                          ₦{rental.basePrice.toLocaleString()}
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="flex-grow">
                      <p className="text-brown/60 line-clamp-3">
                        {rental.description}
                      </p>
                    </CardContent>
                    
                    <CardFooter className="pt-0">
                      <Button 
                        className="w-full bg-brown hover:bg-brown-800 text-cream"
                        onClick={() => openInquiryDialog(rental)}
                      >
                        Inquire Now
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Rentals Section */}
      <section id="rentals-section" className="py-16 px-4 bg-cream">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brown mb-4 font-serif">Our Rental Collection</h2>
            <p className="text-brown/60 max-w-2xl mx-auto">
              Browse our extensive collection of high-quality rental items perfect for any event.
            </p>
          </div>
          
          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown/40" size={18} />
                <Input
                  type="text"
                  placeholder="Search rentals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-brown/30 focus:ring-gold focus:border-gold"
                />
              </div>
              
              <div className="flex gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 border-brown/30 focus:ring-gold focus:border-gold">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {RENTAL_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                  const [field, order] = value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}>
                  <SelectTrigger className="w-48 border-brown/30 focus:ring-gold focus:border-gold">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt-desc">Newest First</SelectItem>
                    <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                    <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                    <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                    <SelectItem value="price-asc">Price (Low to High)</SelectItem>
                    <SelectItem value="price-desc">Price (High to Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Loading State */}
          {status === 'loading' && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
            </div>
          )}
          
          {/* Error State */}
          {status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h3 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h3>
              <p className="text-red-600">{error?.message || 'Failed to load rentals'}</p>
              <Button 
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => dispatch(getRentals({ active: true, inStock: true }))}
              >
                Try Again
              </Button>
            </div>
          )}
          
          {/* Rentals Grid */}
          {status === 'succeeded' && (
            <>
              {filteredRentals.length === 0 ? (
                <div className="text-center py-16">
                  <Package className="mx-auto text-brown/40 mb-4" size={48} />
                  <h3 className="text-xl font-medium text-brown mb-2">No rentals found</h3>
                  <p className="text-brown/60 max-w-md mx-auto">
                    We couldn't find any rentals matching your search criteria. Try different filters or search terms.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredRentals.map((rental, index) => (
                    <motion.div
                      key={rental._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-0 shadow-md h-full flex flex-col hover:shadow-lg transition-shadow">
                        <div className="relative h-48 overflow-hidden">
                          {rental.images && rental.images.length > 0 ? (
                            <img 
                              src={rental.images[0].url} 
                              alt={rental.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-brown-100 flex items-center justify-center">
                              <Package className="text-brown-300" size={48} />
                            </div>
                          )}
                          
                          {rental.featured && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-gold text-brown-900">
                                <Star size={12} className="mr-1" />
                                Featured
                              </Badge>
                            </div>
                          )}
                          
                          {!rental.inStock && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Badge className="bg-red-500 text-white">Out of Stock</Badge>
                            </div>
                          )}
                        </div>
                        
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg text-brown line-clamp-1">{rental.name}</CardTitle>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-brown border-brown/30">
                              {rental.category}
                            </Badge>
                            <span className="font-bold text-gold">
                              ₦{rental.basePrice.toLocaleString()}
                            </span>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="flex-grow">
                          <p className="text-brown/60 text-sm line-clamp-2">
                            {rental.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mt-2">
                            {rental.tags.slice(0, 3).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {rental.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{rental.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        </CardContent>
                        
                        <CardFooter className="pt-0">
                          <Button 
                            className={`w-full ${rental.inStock ? 'bg-gold hover:bg-gold/90 text-brown-900' : 'bg-gray-400 cursor-not-allowed'}`}
                            onClick={() => rental.inStock && openInquiryDialog(rental)}
                            disabled={!rental.inStock}
                          >
                            {rental.inStock ? 'Inquire Now' : 'Out of Stock'}
                          </Button>
                        </CardFooter>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-white">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-brown mb-4 font-serif">Need Help Choosing?</h2>
            <p className="text-brown/60 mb-8">
              Our team is here to help you find the perfect rental items for your event. Contact us today for personalized assistance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-cream p-6 rounded-lg">
                <Phone className="text-gold mx-auto mb-3" size={32} />
                <h3 className="font-semibold text-brown mb-2">Call Us</h3>
                <p className="text-brown/60">+234 123 456 7890</p>
              </div>
              
              <div className="bg-cream p-6 rounded-lg">
                <Mail className="text-gold mx-auto mb-3" size={32} />
                <h3 className="font-semibold text-brown mb-2">Email Us</h3>
                <p className="text-brown/60">info@partypallet.com</p>
              </div>
              
              <div className="bg-cream p-6 rounded-lg">
                <MapPin className="text-gold mx-auto mb-3" size={32} />
                <h3 className="font-semibold text-brown mb-2">Visit Us</h3>
                <p className="text-brown/60">Lagos, Nigeria</p>
              </div>
            </div>
            
            <Button 
              size="lg" 
              className="bg-brown hover:bg-brown-800 text-cream"
              onClick={() => openInquiryDialog(null)}
            >
              Get In Touch
            </Button>
          </div>
        </div>
      </section>

      {/* Inquiry Dialog */}
      <Dialog open={inquiryDialogOpen} onOpenChange={setInquiryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-script text-brown">
              {selectedRental ? `Inquire about ${selectedRental.name}` : 'General Inquiry'}
            </DialogTitle>
            <DialogDescription className="text-brown/60">
              Fill out the form below and we'll get back to you as soon as possible.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleInquirySubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-brown">Full Name</Label>
              <Input
                id="name"
                name="name"
                value={inquiryForm.name}
                onChange={handleInquiryChange}
                required
                className="border-brown/30 focus:ring-gold focus:border-gold"
                placeholder="Your name"
              />
            </div>
            
            <div>
              <Label htmlFor="email" className="text-brown">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={inquiryForm.email}
                onChange={handleInquiryChange}
                required
                className="border-brown/30 focus:ring-gold focus:border-gold"
                placeholder="your.email@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="phone" className="text-brown">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                value={inquiryForm.phone}
                onChange={handleInquiryChange}
                required
                className="border-brown/30 focus:ring-gold focus:border-gold"
                placeholder="+234 123 456 7890"
              />
            </div>
            
            <div>
              <Label htmlFor="eventDate" className="text-brown">Event Date (Optional)</Label>
              <Input
                id="eventDate"
                name="eventDate"
                type="date"
                value={inquiryForm.eventDate}
                onChange={handleInquiryChange}
                className="border-brown/30 focus:ring-gold focus:border-gold"
              />
            </div>
            
            <div>
              <Label htmlFor="message" className="text-brown">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={inquiryForm.message}
                onChange={handleInquiryChange}
                required
                rows={4}
                className="border-brown/30 focus:ring-gold focus:border-gold"
                placeholder="Tell us about your event and rental needs..."
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline" 
                className="border-brown/30 text-brown hover:bg-brown/50"
                onClick={() => setInquiryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gold hover:bg-gold/90 text-brown-900"
              >
                Send Inquiry
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default PublicRentalsPage;