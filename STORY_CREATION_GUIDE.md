# TurnPage Story Creation Guide

This guide explains how to easily add new stories to TurnPage using the flexible story management system.

## Story Structure

Each story follows this structure:
- **Story Metadata**: Title, description, category, etc.
- **Pages**: 4-5 pages of content before first choice (Kindle-like reading)
- **Choices**: Decision points that branch the narrative
- **Page Progression**: Linear flow until choice pages

## Adding a New Story

### 1. Create Story Definition

Add your story to `server/story-manager.ts` in the `loadSampleStories()` method:

```typescript
this.addStory('your-story-id', {
  story: {
    title: "Your Story Title",
    description: "Brief description for the story browser",
    imageUrl: "https://unsplash.com/photo-url", // Use Unsplash for free images
    spiceLevel: 1, // 1 = mild, 2 = medium, 3 = spicy
    category: "lgbt", // "lgbt", "straight", or "all"
    wordCount: 8000, // Approximate word count
    pathCount: 4, // Number of different story paths
    isFeatured: false, // Set to true for featured stories
    isPublished: true
  },
  pages: [
    // Your pages go here (see below)
  ]
});
```

### 2. Create Story Pages

Each story should have 4-5 pages before the first choice:

```typescript
pages: [
  // Starting page (always first)
  {
    id: "start",
    title: "Chapter 1: Opening Scene",
    content: `Your opening content here. Should be 300-500 words.
    
    Create atmosphere, introduce characters, set the scene.
    Remember this is the hook that draws readers in.
    
    Make it immersive and engaging from the first paragraph.`,
    isStarting: true,
    nextPage: "page-2"
  },
  
  // Middle pages (build up to choice)
  {
    id: "page-2", 
    title: "Chapter 2: Development",
    content: `Continue building the story and characters.
    
    Develop tension, relationships, and plot.
    Each page should be substantial reading.`,
    nextPage: "page-3"
  },
  
  {
    id: "page-3",
    title: "Chapter 3: Rising Action", 
    content: `More character and plot development.
    
    Build toward the first major decision point.
    Create emotional investment in the characters.`,
    nextPage: "page-4" 
  },
  
  {
    id: "page-4",
    title: "Chapter 4: Building Tension",
    content: `Continue developing the narrative.
    
    Set up the circumstances that will lead to the choice.
    Make readers care about the outcome.`,
    nextPage: "page-5"
  },
  
  // Choice page (where branching begins)
  {
    id: "page-5",
    title: "Chapter 5: The First Choice",
    content: `Conclude the setup and present the choice.
    
    This page should end at a natural decision point.
    The choice should feel meaningful and impactful.`,
    choices: [
      {
        id: "choice-1a",
        text: "Choose the first option",
        nextNodeId: "path-a-node"
      },
      {
        id: "choice-1b", 
        text: "Choose the second option (Premium)",
        nextNodeId: "path-b-node",
        isPremium: true,
        diamondCost: 25
      }
    ]
  }
]
```

### 3. Story Writing Best Practices

#### Content Guidelines
- **300-500 words per page** for substantial reading
- **5 pages minimum** before first choice
- **Rich character development** and atmospheric detail
- **Authentic dialogue** and emotional progression
- **Clear chapter titles** that create anticipation

#### Choice Design
- Make choices **meaningful and character-driven**
- Premium choices should offer **unique experiences**
- Diamond costs: 25-50 for premium content
- Limit to 2-3 choices per decision point

#### Category Guidelines
- **LGBT**: Stories with queer characters and relationships
- **Straight**: Heterosexual romance and encounters  
- **All**: Stories that appeal to all audiences

#### Spice Levels
- **Level 1**: Romantic tension, mild content
- **Level 2**: Moderate sexual content
- **Level 3**: Explicit adult content

## Story ID Naming

Use descriptive kebab-case IDs:
- `coffee-shop-encounter`
- `university-romance` 
- `office-after-hours`
- `roommate-situation`

## Page ID Structure

Follow this consistent pattern:
- `start` - Always the starting page
- `page-2`, `page-3`, `page-4`, `page-5` - Sequential pages
- `choice-1a`, `choice-1b` - Choice IDs with letters
- `path-a-continue`, `path-b-reveal` - Descriptive branch names

## Testing Your Story

1. Add the story to the story manager
2. Restart the application
3. Navigate to your story in the app
4. Test the full reading flow
5. Verify choices work correctly
6. Check premium content gating

## Advanced Features

### Premium Content
```typescript
{
  id: "premium-choice",
  text: "Unlock premium path", 
  nextNodeId: "premium-content",
  isPremium: true,
  diamondCost: 30
}
```

### Story Branching
After the first choice, you can create complex branching:

```typescript
// Different paths can have their own sub-choices
{
  id: "path-a-continue",
  title: "Path A: Chapter 6", 
  content: "Path A specific content...",
  choices: [
    {
      id: "choice-2a",
      text: "Continue path A direction 1",
      nextNodeId: "path-a1-ending"
    },
    {
      id: "choice-2b", 
      text: "Continue path A direction 2",
      nextNodeId: "path-a2-ending"
    }
  ]
}
```

## Story Manager API

The StoryManager provides these methods for easy story management:

```typescript
// Add a new story
storyManager.addStory(storyId, definition);

// Get all stories
storyManager.getAllStories();

// Get specific story
storyManager.getStory(storyId);

// Get story node/page
storyManager.getStoryNode(nodeId);

// Get choices for a page
storyManager.getChoicesFromNode(nodeId);
```

## Future Enhancements

The story system is designed to be easily extended with:
- Visual story editor interface
- Import/export story files
- Version control for stories
- Analytics and reader engagement tracking
- Dynamic pricing for premium content

This flexible system allows you to focus on writing great stories while the technical infrastructure handles the rest!