# Media Assets Guide

This document explains where to place your images and videos for the Kayak Vending Machine application.

## 📁 Media File Locations

All media files should be placed in: `frontend/public/media/`

Create the following folder structure:
```
frontend/
  public/
    media/
      images/
        locker-system.jpg
        locker-location.jpg
      videos/
        machine-operation.mp4
        water-entry.mp4
        kayak-return.mp4
        passcode-entry.mp4
        safety-launch.mp4
```

## 🎬 Video Files Needed

### 1. **machine-operation.mp4**
- **Location**: Home page "How It Works" section
- **Content**: Show how easy it is to use the passcode and unlock a kayak from the vending machine
- **Recommended length**: 30-60 seconds
- **Tips**: Show the keypad, entering the code, and the locker opening

### 2. **water-entry.mp4**
- **Location**: Home page "How It Works" section
- **Content**: Demonstrate the best technique for safely entering the water with the kayak
- **Recommended length**: 30-45 seconds
- **Tips**: Include safety reminders like wearing a life jacket

### 3. **kayak-return.mp4**
- **Location**: Home page "How It Works" section
- **Content**: Step-by-step guide on returning the kayak and taking the required photo
- **Recommended length**: 30-60 seconds
- **Tips**: Show the proper return procedure and photo angle

### 4. **passcode-entry.mp4**
- **Location**: Rent page "Quick Start Guide" section
- **Content**: Close-up of entering the passcode on the locker keypad
- **Recommended length**: 15-30 seconds
- **Tips**: Clear view of the keypad and successful unlock

### 5. **safety-launch.mp4**
- **Location**: Rent page "Quick Start Guide" section
- **Content**: Proper kayak handling and water entry techniques for a safe experience
- **Recommended length**: 45-60 seconds
- **Tips**: Include life jacket reminder and paddling basics

## 🖼️ Image Files Needed

### 1. **locker-system.jpg**
- **Location**: Home page "How It Works" section
- **Content**: Photo of the secure locker system where kayaks are stored
- **Recommended specs**: 1200x800px, high quality JPG
- **Tips**: Show the full locker unit with numbered compartments

### 2. **locker-location.jpg**
- **Location**: Rent page "Quick Start Guide" section
- **Content**: Photo showing how to find your kayak locker using the location code
- **Recommended specs**: 1200x800px, high quality JPG
- **Tips**: Include visible locker numbers and clear signage

## 🔄 How to Update Media Files

Once you have your media files ready:

1. Create the folder structure: `frontend/public/media/images/` and `frontend/public/media/videos/`

2. Place your files in the appropriate folders

3. Update the MediaGallery components in the code to use actual file paths instead of placeholders:

### Example for Home.tsx:
```typescript
{
    type: 'video',
    title: 'Operating the Machine',
    description: 'Watch how easy it is to use your passcode and unlock your kayak.',
    placeholder: '/media/videos/machine-operation.mp4'  // Changed from placeholder text to actual path
}
```

### Example for Rent.tsx:
```typescript
{
    type: 'image',
    title: 'Locker Location',
    description: 'Find your kayak locker using the location code provided.',
    placeholder: '/media/images/locker-location.jpg'  // Changed from placeholder text to actual path
}
```

## 📱 Video Format Recommendations

- **Format**: MP4 (H.264 codec)
- **Resolution**: 1920x1080 (1080p) or 1280x720 (720p)
- **Aspect Ratio**: 16:9
- **File Size**: Keep under 10MB per video for fast loading
- **Audio**: Optional (consider adding voiceover or background music)

## 🎨 Image Format Recommendations

- **Format**: JPG for photos, PNG for graphics with transparency
- **Resolution**: At least 1200x800px
- **File Size**: Optimize to 200-500KB per image
- **Quality**: High quality but compressed for web

## 🚀 Testing Your Media

After adding media files:

1. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

2. Visit these pages to check your media:
   - Home page: `http://localhost:3000/`
   - Rent page: `http://localhost:3000/rent`

3. Verify that:
   - Videos play smoothly
   - Images load quickly
   - Hover effects work on media cards
   - Mobile responsiveness looks good

## 📝 Current Placeholder Status

All media sections currently show placeholder cards with:
- Icon indicating media type (🖼️ for images, 🎥 for videos)
- Title and description
- File path placeholder (e.g., "Place video: machine-operation.mp4")

These will automatically update to show your actual media once files are added to the correct locations.

## ✨ Optional Enhancements

Consider these additional improvements:

1. **Thumbnail Images**: Create custom thumbnails for videos
2. **Loading States**: Add loading spinners while videos buffer
3. **Captions**: Add subtitles to videos for accessibility
4. **Autoplay**: Consider muted autoplay for hero videos
5. **Gallery Modal**: Add full-screen view for images/videos

---

**Need Help?** Contact your development team to implement these changes or add new media sections to other pages.
