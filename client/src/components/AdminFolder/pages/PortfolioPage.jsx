import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Plus, Edit, Trash2, Search, Image as ImageIcon, Eye, Star, 
  Calendar, MapPin, Tag, AlertTriangle
} from 'lucide-react';
import { 
  Card, CardContent, CardHeader, CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { 
  getPortfolioItems, 
  createPortfolioItem, 
  updatePortfolioItem, 
  deletePortfolioItem,
  getPortfolioCategories,
  resetPortfolioState
} from '@/redux/slice/portfolioSlice';

// Portfolio categories from the model
const PORTFOLIO_CATEGORIES = [
  "Birthday",
  "Bridal Shower", 
  "Baby Shower",
  "House",
  "Hall",
  "Other"
];

// Confirmation Dialog Component
const ConfirmationDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Confirm Deletion",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel"
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle size={20} />
            {title}
          </DialogTitle>
          <DialogDescription className="text-brown/600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-brown/30 text-brown"
          >
            {cancelText}
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PortfolioPage = () => {
  const dispatch = useDispatch();
  const { 
    portfolioItems, 
    portfolioCategories, 
    status, 
    error, 
    pagination 
  } = useSelector((state) => state.portfolio);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPortfolioItem, setCurrentPortfolioItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [portfolioItemToDelete, setPortfolioItemToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: PORTFOLIO_CATEGORIES[0], // Default to first category
    description: '',
    shotDate: '',
    location: '',
    isPublished: true,
    featured: false,
    tags: '',
    images: []
  });
  
  const [imagePreviews, setImagePreviews] = useState([]);
  
  // Fetch portfolio items and categories on component mount
  useEffect(() => {
    dispatch(getPortfolioItems({ page: currentPage, limit: 10 }));
    dispatch(getPortfolioCategories());
    
    return () => {
      dispatch(resetPortfolioState());
    };
  }, [dispatch, currentPage]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle image uploads
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [...formData.images, ...files];
    const newPreviews = [...imagePreviews];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newPreviews.push(event.target.result);
        if (newPreviews.length === newImages.length) {
          setImagePreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
    
    setFormData({
      ...formData,
      images: newImages
    });
  };
  
  // Remove an image
  const handleRemoveImage = (index) => {
    const newImages = [...formData.images];
    const newPreviews = [...imagePreviews];
    
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    
    setFormData({
      ...formData,
      images: newImages
    });
    setImagePreviews(newPreviews);
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      category: PORTFOLIO_CATEGORIES[0],
      description: '',
      shotDate: '',
      location: '',
      isPublished: true,
      featured: false,
      tags: '',
      images: []
    });
    setImagePreviews([]);
    setIsEditing(false);
    setCurrentPortfolioItem(null);
  };
  
  // Open dialog for adding new portfolio item
  const openAddDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };
  
  // Open dialog for editing portfolio item
  const openEditDialog = (portfolioItem) => {
    setCurrentPortfolioItem(portfolioItem);
    setIsEditing(true);
    
    setFormData({
      title: portfolioItem.title,
      category: portfolioItem.category,
      description: portfolioItem.description,
      shotDate: portfolioItem.shotDate ? new Date(portfolioItem.shotDate).toISOString().split('T')[0] : '',
      location: portfolioItem.location || '',
      isPublished: portfolioItem.isPublished,
      featured: portfolioItem.featured,
      tags: portfolioItem.tags.join(', '),
      images: [] // We'll keep existing images separate for updates
    });
    
    // Set existing image previews
    setImagePreviews(portfolioItem.images.map(img => img.url));
    setIsDialogOpen(true);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const portfolioData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    if (isEditing && currentPortfolioItem) {
      dispatch(updatePortfolioItem({ id: currentPortfolioItem._id, portfolioData }))
        .unwrap()
        .then(() => {
          toast.success('Portfolio item updated successfully');
          setIsDialogOpen(false);
          resetForm();
        })
        .catch((error) => {
          toast.error(error.message || 'Failed to update portfolio item');
        });
    } else {
      dispatch(createPortfolioItem(portfolioData))
        .unwrap()
        .then(() => {
          toast.success('Portfolio item created successfully');
          setIsDialogOpen(false);
          resetForm();
        })
        .catch((error) => {
          toast.error(error.message || 'Failed to create portfolio item');
        });
    }
  };
  
  // Open delete confirmation dialog
  const openDeleteDialog = (portfolioItem) => {
    setPortfolioItemToDelete(portfolioItem);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle portfolio item deletion
  const handleDeletePortfolioItem = () => {
    if (portfolioItemToDelete) {
      dispatch(deletePortfolioItem(portfolioItemToDelete._id))
        .unwrap()
        .then(() => {
          toast.success('Portfolio item deleted successfully');
          setPortfolioItemToDelete(null);
        })
        .catch((error) => {
          toast.error(error.message || 'Failed to delete portfolio item');
        });
    }
  };
  
  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const params = { 
      search: searchTerm, 
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      page: 1,
      limit: 10
    };
    dispatch(getPortfolioItems(params));
    setCurrentPage(1);
  };
  
  // Handle category filter
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    const params = { 
      search: searchTerm, 
      category: category !== 'all' ? category : undefined,
      page: 1,
      limit: 10
    };
    dispatch(getPortfolioItems(params));
    setCurrentPage(1);
  };
  
  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
    const params = { 
      search: searchTerm, 
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      page,
      limit: 10
    };
    dispatch(getPortfolioItems(params));
  };
  
  // Filter portfolio items based on search and category
  const filteredPortfolioItems = portfolioItems.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <Card className="bg-white border-brown/20 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-script text-brown flex items-center gap-2">
            <ImageIcon className="text-gold" size={24} />
            Portfolio Management
          </CardTitle>
          <p className="text-brown/60">
            Manage your portfolio items and showcase your work
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Search and Filter Section */}
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown/40" size={18} />
                <Input
                  type="text"
                  placeholder="Search portfolio items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-brown/30 focus:ring-gold focus:border-gold"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-gold hover:bg-gold/90 text-brown-900"
              >
                Search
              </Button>
            </form>
            
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-48 border-brown/30 focus:ring-gold focus:border-gold">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {portfolioCategories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category._id} ({category.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={openAddDialog}
                className="bg-gold hover:bg-gold/90 text-brown-900 flex items-center gap-2"
              >
                <Plus size={16} />
                Add Portfolio Item
              </Button>
            </div>
          </div>
          
          {/* Portfolio Items Table */}
          <Card className="bg-cream/50 border-brown/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-script text-brown">
                Portfolio Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              {status === 'loading' ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gold"></div>
                  <p className="mt-2 text-brown/60">Loading portfolio items...</p>
                </div>
              ) : filteredPortfolioItems.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="mx-auto text-brown/40 mb-2" size={32} />
                  <p className="text-brown/60">No portfolio items found</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-brown/20">
                          <TableHead className="text-brown">Image</TableHead>
                          <TableHead className="text-brown">Title</TableHead>
                          <TableHead className="text-brown">Category</TableHead>
                          <TableHead className="text-brown">Date</TableHead>
                          <TableHead className="text-brown">Views</TableHead>
                          <TableHead className="text-brown">Status</TableHead>
                          <TableHead className="text-brown text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPortfolioItems.map((item) => (
                          <TableRow key={item._id} className="border-brown/10">
                            <TableCell>
                              <div className="w-12 h-12 rounded-md overflow-hidden bg-brown/100 flex items-center justify-center">
                                {item.images && item.images.length > 0 ? (
                                  <img 
                                    src={item.images[0].url} 
                                    alt={item.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="text-brown/40" size={20} />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-brown">
                              {item.title}
                              {item.featured && (
                                <Badge className="ml-2 bg-gold text-brown-900">
                                  <Star size={12} className="mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-brown/70">
                              {item.category}
                            </TableCell>
                            <TableCell className="text-brown/70">
                              {item.shotDate ? new Date(item.shotDate).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell className="text-brown/70">
                              <div className="flex items-center gap-1">
                                <Eye size={14} />
                                {item.viewCount || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {item.isPublished ? (
                                  <Badge className="bg-green-100 text-green-800">Published</Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-brown/30 text-brown hover:bg-brown/50"
                                  onClick={() => openEditDialog(item)}
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                  onClick={() => openDeleteDialog(item)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center mt-6 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-brown/30 text-brown"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={currentPage === page 
                            ? "bg-gold text-brown-900" 
                            : "border-brown/30 text-brown hover:bg-brown/50"}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-brown/30 text-brown"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.pages}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Error Display */}
          {status === 'failed' && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <AlertTitle className="text-red-800">Error</AlertTitle>
              <AlertDescription className="text-red-600">
                {error?.message || 'Failed to load portfolio items'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Portfolio Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-script text-brown">
              {isEditing ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}
            </DialogTitle>
            <DialogDescription className="text-brown/60">
              {isEditing 
                ? 'Update the portfolio item information below.'
                : 'Fill in the details to add a new portfolio item to your gallery.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-brown">Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="border-brown/30 focus:ring-gold focus:border-gold"
                    placeholder="Enter portfolio title"
                  />
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-brown">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => handleInputChange({ target: { name: 'category', value } })}
                  >
                    <SelectTrigger className="border-brown/30 focus:ring-gold focus:border-gold">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {PORTFOLIO_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="shotDate" className="text-brown">Shot Date</Label>
                  <Input
                    id="shotDate"
                    name="shotDate"
                    type="date"
                    value={formData.shotDate}
                    onChange={handleInputChange}
                    className="border-brown/30 focus:ring-gold focus:border-gold"
                  />
                </div>
                
                <div>
                  <Label htmlFor="location" className="text-brown">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="border-brown/30 focus:ring-gold focus:border-gold"
                    placeholder="Event location"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tags" className="text-brown">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="border-brown/30 focus:ring-gold focus:border-gold"
                    placeholder="e.g., wedding, birthday, corporate"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPublished"
                      name="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => 
                        handleInputChange({ target: { name: 'isPublished', value: checked, type: 'checkbox' } })
                      }
                    />
                    <Label htmlFor="isPublished" className="text-brown">Published</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="featured"
                      name="featured"
                      checked={formData.featured}
                      onCheckedChange={(checked) => 
                        handleInputChange({ target: { name: 'featured', value: checked, type: 'checkbox' } })
                      }
                    />
                    <Label htmlFor="featured" className="text-brown">Featured</Label>
                  </div>
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description" className="text-brown">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="border-brown/30 focus:ring-gold focus:border-gold"
                    placeholder="Enter portfolio description"
                  />
                </div>
                
                <div>
                  <Label className="text-brown">Images</Label>
                  <div className="mt-2">
                    <Label 
                      htmlFor="image-upload" 
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-brown/30 rounded-lg cursor-pointer bg-cream/50 hover:bg-cream"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-2 text-brown/40" />
                        <p className="text-sm text-brown/60">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-brown/40">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                      <Input 
                        id="image-upload" 
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                    </Label>
                  </div>
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={preview} 
                            alt={`Preview ${index}`}
                            className="w-full h-24 object-cover rounded-md"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index)}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-brown/10">
              <Button 
                type="button" 
                variant="outline" 
                className="border-brown/30 text-brown hover:bg-brown/50"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gold hover:bg-gold/90 text-brown-900"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Saving...' : (isEditing ? 'Update Portfolio Item' : 'Add Portfolio Item')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeletePortfolioItem}
        title="Delete Portfolio Item"
        description={`Are you sure you want to delete "${portfolioItemToDelete?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </motion.div>
  );
};

export default PortfolioPage;