// models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { 
      type: String, 
      required: true,
      enum: [
        'Concert', 
        'Festival', 
        'Conference', 
        'Workshop', 
        'Sports', 
        'Theater', 
        'Comedy', 
        'Exhibition', 
        'Networking', 
        'Other'
    ]
    },
    description: { 
        type: String, 
        required: true 
    },
    venue: { 
        type: String, 
        required: true 
    },
    address: { 
        type: String, 
        default: '' 
    },
    city: { 
        type: String, 
        required: 
        true 
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    endDate: { 
        type: Date, 
        required: true 
    },
    startTime: { 
        type: String, 
        default: '' 
    },
    // longitude: { 
    //     type: Number, 
    //     default: 0 
    // },
    // latitude: { 
    //     type: Number, 
    //     default: 0 
    // },
    endTime: { 
        type: String, 
        default: '' 
    },
    bannerImage: { 
        type: String, 
        default: '' 
    },
    organizerName: { 
        type: String, 
        required: true 
    },
    organizerEmail: { 
        type: String, 
        required: false 
    },
    organizerPhone: { 
        type: String, 
        default: '' 
    },
    collectMatriculationNumber: {
        type: Boolean,
        default: false
    },
    ticketTiers: [
      {
        name: { 
            type: String, 
            required: true 
        },
        price: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        quantity: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        maxPerPerson: { 
            type: Number, 
            default: 1 
        },
        description: { 
            type: String, 
            default: '' 
        },
        sold: { 
            type: Number, 
            default: 0 
        }
      }
    ],
    ticketsSold: { 
        type: Number, 
        default: 0 
    },
    totalTickets: { 
        type: Number, 
        default: 0 
    },
    revenue: { 
        type: Number, 
        default: 0 
    },
    faq: [{ 
        question: String, 
        answer: String 
    }],
    likes: [{ 
        type: String 
    }], 
    likeCount: { 
        type: Number, 
        default: 0 
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'cancelled', 'completed', 'expired'],
      default: 'published'
    },
    organizer: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    shareId: { 
        type: String, 
    },
    shareUrl: {  
      type: String,
      default: ''
    },
    qrCodeDataUrl: {  
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);



eventSchema.pre('save', function(next) {
  const now = new Date();
  if (this.endDate && new Date(this.endDate) < now && this.status === 'published') {
    this.status = 'expired';
  }
  next();
});

// Static method to update expired events
// models/Event.js

// Static method to update expired events
eventSchema.statics.updateExpiredEvents = async function() {
  const now = new Date();
  
  // Get all published/draft events
  const events = await this.find({
    status: { $in: ['published', 'draft'] }
  });
  
  let expiredCount = 0;
  
  for (const event of events) {
    // Combine endDate and endTime
    const endDateTime = new Date(event.endDate);
    
    if (event.endTime) {
      const [hours, minutes] = event.endTime.split(':').map(Number);
      endDateTime.setHours(hours || 0, minutes || 0, 0, 0);
    } else {
      // If no endTime, set to end of day (23:59:59)
      endDateTime.setHours(23, 59, 59, 999);
    }
    
    // Check if event has expired
    if (endDateTime < now) {
      await this.findByIdAndUpdate(event._id, { status: 'expired' });
      expiredCount++;
    }
  }
  
  console.log(`Updated ${expiredCount} events to expired status`);
  return { modifiedCount: expiredCount };
};


module.exports = mongoose.model('Event', eventSchema);