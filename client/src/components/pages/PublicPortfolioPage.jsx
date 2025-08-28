import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { 
  Search, Filter, Calendar, MapPin, Eye, Heart, Share2, 
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { 
  getPortfolioItems, 
  getFeaturedPortfolioItems, 
  getPortfolioCategories,
  getPortfolioItem,
  selectAllPortfolioItems,
  selectFeaturedPortfolioItems,
  selectPortfolioCategories,
  selectCurrentPortfolioItem,
  selectPortfolioStatus,
  selectPortfolioError
} from '@/redux/slice/portfolioSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Navbar from '../Navbar';

// Portfolio categories from the model
const PORTFOLIO_CATEGORIES = [
  "Birthday",
  "Bridal Shower", 
  "Baby Shower",
  "House",
  "Hall",
  "Other"
];

const PublicPortfolioPage = () => {
  const dispatch = useDispatch();
  const portfolioItems = useSelector(selectAllPortfolioItems);
  const featuredPortfolioItems = useSelector(selectFeaturedPortfolioItems);
  const portfolioCategories = useSelector(selectPortfolioCategories);
  const currentPortfolioItem = useSelector(selectCurrentPortfolioItem);
  const status = useSelector(selectPortfolioStatus);
  const error = useSelector(selectPortfolioError);
  
  const { id } = useParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Fetch portfolio items and categories on component mount
  useEffect(() => {
    dispatch(getPortfolioItems({ isPublished: true }));
    dispatch(getFeaturedPortfolioItems());
    dispatch(getPortfolioCategories());
  }, [dispatch]);
  
  // Fetch single portfolio item if ID is provided in URL
  useEffect(() => {
    if (id) {
      dispatch(getPortfolioItem(id));
    }
  }, [dispatch, id]);
  
  // Filter and sort portfolio items
  const filteredPortfolioItems = portfolioItems
    .filter(item => {
      const matchesSearch = searchTerm === '' || 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortOrder === 'asc' 
          ? new Date(a.shotDate || a.createdAt) - new Date(b.shotDate || b.createdAt)
          : new Date(b.shotDate || b.createdAt) - new Date(a.shotDate || a.createdAt);
      } else if (sortBy === 'views') {
        return sortOrder === 'asc' 
          ? (a.viewCount || 0) - (b.viewCount || 0)
          : (b.viewCount || 0) - (a.viewCount || 0);
      } else if (sortBy === 'title') {
        return sortOrder === 'asc' 
          ? a.title.localeCompare(b.title) 
          : b.title.localeCompare(a.title);
      } else {
        // Default sort by createdAt
        return sortOrder === 'asc' 
          ? new Date(a.createdAt) - new Date(b.createdAt)
          : new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  
  // Open lightbox at specific image
  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setIsLightboxOpen(true);
  };
  
  // Navigate to next image in lightbox
  const nextImage = () => {
    if (currentPortfolioItem && currentPortfolioItem.images) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === currentPortfolioItem.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };
  
  // Navigate to previous image in lightbox
  const prevImage = () => {
    if (currentPortfolioItem && currentPortfolioItem.images) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? currentPortfolioItem.images.length - 1 : prevIndex - 1
      );
    }
  };
  
  // Handle keyboard navigation in lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      
      if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, currentPortfolioItem]);
  
  // If we're viewing a single portfolio item
  if (id && currentPortfolioItem) {
    return (
        <>
         <Navbar/>
      <div className="min-h-screen bg-cream">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-brown-900 to-brown-700 text-cream py-20 px-4">
          <div className="container mx-auto text-center">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold mb-6 font-serif"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {currentPortfolioItem.title}
            </motion.h1>
            
            <motion.div 
              className="flex flex-wrap justify-center items-center gap-4 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Badge className="bg-gold text-brown-900">
                {currentPortfolioItem.category}
              </Badge>
              
              {currentPortfolioItem.shotDate && (
                <div className="flex items-center gap-1">
                  <Calendar size={16} />
                  <span>{new Date(currentPortfolioItem.shotDate).toLocaleDateString()}</span>
                </div>
              )}
              
              {currentPortfolioItem.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={16} />
                  <span>{currentPortfolioItem.location}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Eye size={16} />
                <span>{currentPortfolioItem.viewCount || 0} views</span>
              </div>
            </motion.div>
          </div>
        </section>
        
        {/* Portfolio Item Content */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Images */}
              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentPortfolioItem.images && currentPortfolioItem.images.length > 0 ? (
                    currentPortfolioItem.images.map((image, index) => (
                      <motion.div
                        key={index}
                        className="relative overflow-hidden rounded-lg shadow-md cursor-pointer group"
                        whileHover={{ y: -5 }}
                        onClick={() => openLightbox(index)}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        <img 
                          src={image.url} 
                          alt={image.caption || currentPortfolioItem.title}
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Eye size={20} className="text-brown" />
                          </div>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-2 bg-brown-100 rounded-lg h-64 flex items-center justify-center">
                      <p className="text-brown-500">No images available</p>
                    </div>
                  )}
                </div>
                
                {/* Tags */}
                {currentPortfolioItem.tags && currentPortfolioItem.tags.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold text-brown mb-3">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {currentPortfolioItem.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-brown border-brown/30">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Details */}
              <div>
                <Card className="bg-white border-brown/20 shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-brown mb-4 font-serif">Project Details</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-brown mb-2">Description</h3>
                      <p className="text-brown/70">
                        {currentPortfolioItem.description}
                      </p>
                    </div>
                    
                    {currentPortfolioItem.shotDate && (
                      <div>
                        <h3 className="font-semibold text-brown mb-2">Event Date</h3>
                        <p className="text-brown/70">
                          {new Date(currentPortfolioItem.shotDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    )}
                    
                    {currentPortfolioItem.location && (
                      <div>
                        <h3 className="font-semibold text-brown mb-2">Location</h3>
                        <p className="text-brown/70">
                          {currentPortfolioItem.location}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="font-semibold text-brown mb-2">Category</h3>
                      <Badge className="bg-gold text-brown-900">
                        {currentPortfolioItem.category}
                      </Badge>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold text-brown mb-2">Share</h3>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-brown/30 text-brown"
                          onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Link copied to clipboard!');
                          }}
                        >
                          <Share2 size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-brown/30 text-brown"
                          onClick={() => {
                            // This would open a share dialog or implement social sharing
                            toast.info('Social sharing coming soon!');
                          }}
                        >
                          <Heart size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
                
                {/* Related Projects */}
                <Card className="bg-white border-brown/20 shadow-sm p-6 mt-6">
                  <h3 className="text-xl font-bold text-brown mb-4 font-serif">Related Projects</h3>
                  
                  <div className="space-y-4">
                    {portfolioItems
                      .filter(item => 
                        item._id !== currentPortfolioItem._id && 
                        item.category === currentPortfolioItem.category
                      )
                      .slice(0, 3)
                      .map((item, index) => (
                        <motion.div
                          key={item._id}
                          className="flex gap-4 cursor-pointer group"
                          whileHover={{ x: 5 }}
                          onClick={() => window.location.href = `/portfolio/${item._id}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-brown-100 flex-shrink-0">
                            {item.images && item.images.length > 0 ? (
                              <img 
                                src={item.images[0].url} 
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-brown-200 flex items-center justify-center">
                                <span className="text-xs text-brown-500">No Image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-brown group-hover:text-gold transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-sm text-brown/60">
                              {item.category} • {new Date(item.shotDate || item.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>
        
        {/* Lightbox */}
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-4xl p-0 bg-black/90 border-0">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 z-10 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
            >
              <X size={20} />
            </button>
            
            {currentPortfolioItem && currentPortfolioItem.images && currentPortfolioItem.images.length > 0 && (
              <div className="relative">
                <img 
                  src={currentPortfolioItem.images[currentImageIndex].url} 
                  alt={currentPortfolioItem.images[currentImageIndex].caption || currentPortfolioItem.title}
                  className="max-h-[80vh] w-auto mx-auto"
                />
                
                {currentPortfolioItem.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white bg-black/50 rounded-full p-2 hover:bg-black/80"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
                
                {currentPortfolioItem.images[currentImageIndex].caption && (
                  <div className="absolute bottom-4 left-0 right-0 text-center text-white bg-black/50 p-2">
                    {currentPortfolioItem.images[currentImageIndex].caption}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
        </>
    );
  }
  
  // Default portfolio gallery view
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
        
        <div className="container mx-auto text-center relative z-10">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold mb-6 font-serif"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Our <span className="text-gold">Portfolio</span>
          </motion.h1>
          
          <motion.p 
            className="text-xl max-w-2xl mx-auto mb-10 text-cream/90"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Explore our collection of beautifully decorated events and celebrations.
          </motion.p>
        </div>
      </section>

      {/* Featured Portfolio Items */}
      {featuredPortfolioItems.length > 0 && (
        <section className="py-16 px-4 bg-white">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-brown mb-4 font-serif">Featured Projects</h2>
              <p className="text-brown/60 max-w-2xl mx-auto">
                Check out some of our most memorable event decorations and celebrations.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredPortfolioItems.map((item, index) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden border-0 shadow-lg h-full flex flex-col">
                    <div className="relative h-64 overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0].url} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brown-100 flex items-center justify-center">
                          <span className="text-brown-500">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-gold text-brown-900">
                          Featured
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="flex-grow p-6">
                      <h3 className="text-xl font-bold text-brown mb-2">{item.title}</h3>
                      <div className="flex items-center gap-4 mb-4">
                        <Badge variant="outline" className="text-brown border-brown/30">
                          {item.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-brown/60">
                          <Eye size={14} />
                          <span>{item.viewCount || 0}</span>
                        </div>
                      </div>
                      <p className="text-brown/60 line-clamp-3 mb-4">
                        {item.description}
                      </p>
                      <Button 
                        className="w-full bg-brown hover:bg-brown-800 text-cream"
                        onClick={() => window.location.href = `/portfolio/${item._id}`}
                      >
                        View Project
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Portfolio Items Section */}
      <section className="py-16 px-4 bg-cream">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brown mb-4 font-serif">All Projects</h2>
            <p className="text-brown/60 max-w-2xl mx-auto">
              Browse our complete portfolio of event decorations and celebrations.
            </p>
          </div>
          
          {/* Search and Filter */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown/40" size={18} />
                <Input
                  type="text"
                  placeholder="Search projects..."
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
                    {PORTFOLIO_CATEGORIES.map((category) => (
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
                    <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                    <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                    <SelectItem value="date-asc">Date (Earliest)</SelectItem>
                    <SelectItem value="date-desc">Date (Latest)</SelectItem>
                    <SelectItem value="views-desc">Most Viewed</SelectItem>
                    <SelectItem value="views-asc">Least Viewed</SelectItem>
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
              <p className="text-red-600">{error?.message || 'Failed to load portfolio items'}</p>
              <Button 
                className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => dispatch(getPortfolioItems({ isPublished: true }))}
              >
                Try Again
              </Button>
            </div>
          )}
          
          {/* Portfolio Grid */}
          {status === 'succeeded' && (
            <>
              {filteredPortfolioItems.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-brown-40 mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-brown mb-2">No projects found</h3>
                  <p className="text-brown/60 max-w-md mx-auto">
                    We couldn't find any projects matching your search criteria. Try different filters or search terms.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPortfolioItems.map((item, index) => (
                    <motion.div
                      key={item._id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                    >
                      <Card className="overflow-hidden border-0 shadow-md h-full flex flex-col hover:shadow-lg transition-shadow">
                        <div className="relative h-56 overflow-hidden">
                          {item.images && item.images.length > 0 ? (
                            <img 
                              src={item.images[0].url} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-brown-100 flex items-center justify-center">
                              <span className="text-brown-500">No Image</span>
                            </div>
                          )}
                          
                          {item.featured && (
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-gold text-brown-900">
                                Featured
                              </Badge>
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="flex-grow p-6">
                          <h3 className="text-xl font-bold text-brown mb-2 line-clamp-1">{item.title}</h3>
                          
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-brown border-brown/30">
                              {item.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-brown/60">
                              <Eye size={14} />
                              <span>{item.viewCount || 0}</span>
                            </div>
                          </div>
                          
                          <p className="text-brown/60 text-sm line-clamp-2 mb-4">
                            {item.description}
                          </p>
                          
                          <div className="mt-auto">
                            <Button 
                              className="w-full bg-brown hover:bg-brown-800 text-cream"
                              onClick={() => window.location.href = `/portfolio/${item._id}`}
                            >
                              View Project
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
    </>
  );
};

export default PublicPortfolioPage;