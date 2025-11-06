import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEditor } from './EditorProvider';
import { Testimonial } from '../types';

interface AddTestimonialModalProps {
    testimonial: Partial<Testimonial>;
    onClose: () => void;
}

const AddTestimonialModal: React.FC<AddTestimonialModalProps> = ({ testimonial, onClose }) => {
    const { updateSiteContent } = useEditor();
    const [formData, setFormData] = useState<Partial<Testimonial>>(testimonial);
    const isNew = !testimonial.id;

    useEffect(() => {
        setFormData(testimonial);
    }, [testimonial]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        updateSiteContent(draft => {
            if (isNew) {
                const newTestimonial: Testimonial = {
                    id: `t_${Date.now()}`,
                    quote: formData.quote || '',
                    name: formData.name || '',
                    title: formData.title || '',
                    image: formData.image || `https://i.pravatar.cc/150?u=${Date.now()}` // Placeholder image
                };
                draft.testimonials.unshift(newTestimonial);
            } else {
                const index = draft.testimonials.findIndex(t => t.id === formData.id);
                if (index > -1) {
                    draft.testimonials[index] = { ...draft.testimonials[index], ...formData };
                }
            }
        });
        
        onClose();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[102] flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4">{isNew ? 'Add Testimonial' : 'Edit Testimonial'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="quote" className="block text-sm font-medium text-neutral-400 mb-1">Quote</label>
                        <textarea id="quote" name="quote" value={formData.quote || ''} onChange={handleChange} required rows={4} className="w-full bg-neutral-800 border border-neutral-600 rounded-md py-2 px-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="name" className="block text-sm font-medium text-neutral-400 mb-1">Name</label>
                        <input type="text" id="name" name="name" value={formData.name || ''} onChange={handleChange} required className="w-full bg-neutral-800 border border-neutral-600 rounded-md py-2 px-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="title" className="block text-sm font-medium text-neutral-400 mb-1">Title</label>
                        <input type="text" id="title" name="title" value={formData.title || ''} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-600 rounded-md py-2 px-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                     <div>
                        <label htmlFor="image" className="block text-sm font-medium text-neutral-400 mb-1">Image URL</label>
                        <input type="text" id="image" name="image" value={formData.image || ''} onChange={handleChange} className="w-full bg-neutral-800 border border-neutral-600 rounded-md py-2 px-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-neutral-300 bg-neutral-700 rounded-md hover:bg-neutral-600 transition-colors">Cancel</button>
                        <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors">
                            {isNew ? 'Add Testimonial' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default AddTestimonialModal;
