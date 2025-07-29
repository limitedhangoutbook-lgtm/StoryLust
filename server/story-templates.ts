import type { StoryDefinition } from "./story-manager";

// Template for creating new stories
export const createStoryTemplate = (
  storyId: string,
  title: string,
  description: string,
  category: "lgbt" | "straight" | "all" = "lgbt",
  spiceLevel: 1 | 2 | 3 = 1
): StoryDefinition => {
  return {
    story: {
      title,
      description,
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop", // Default image
      spiceLevel,
      category,
      wordCount: 8000, // Estimate
      pathCount: 4, // Default paths
      isFeatured: false,
      isPublished: true
    },
    pages: [
      {
        id: "start",
        title: "Chapter 1: The Beginning",
        content: `[Write your opening scene here - 300-500 words]

This should introduce your main characters and setting.
Create atmosphere and draw the reader in.

Consider:
- Who are your main characters?
- Where does this take place?
- What's the initial situation that brings them together?
- What mood/atmosphere are you creating?

Remember: This is page 1 of 5 before the first choice, so focus on world-building and character introduction rather than rushing to decisions.`,
        isStarting: true,
        nextPage: "page-2"
      },
      {
        id: "page-2",
        title: "Chapter 2: Development",
        content: `[Continue developing your story - 300-500 words]

Build on the foundation from Chapter 1.
Develop character relationships and plot.

Consider:
- How do your characters interact?
- What tensions or attractions are building?
- What obstacles or complications arise?
- How does the setting influence the story?

This is your second page of setup - continue building investment in your characters and their situation.`,
        nextPage: "page-3"
      },
      {
        id: "page-3",
        title: "Chapter 3: Building Connection",
        content: `[Deepen the story and relationships - 300-500 words]

This is where relationships and tensions really develop.

Consider:
- How are your characters changing?
- What discoveries do they make about each other?
- What internal conflicts are they facing?
- How is the romantic/sexual tension building?

You're halfway to the first choice - make sure readers are emotionally invested in what happens next.`,
        nextPage: "page-4"
      },
      {
        id: "page-4",
        title: "Chapter 4: Rising Tension", 
        content: `[Build toward the first major decision - 300-500 words]

This page should create the circumstances that lead to your first choice.

Consider:
- What situation puts your characters at a crossroads?
- What are the stakes of the upcoming decision?
- How have their feelings evolved?
- What external pressures or opportunities arise?

Set up the choice without revealing it yet - create anticipation.`,
        nextPage: "page-5"
      },
      {
        id: "page-5",
        title: "Chapter 5: The First Choice",
        content: `[Present the choice scenario - 300-500 words]

This is where your story reaches its first major decision point.

Consider:
- What specific situation requires a choice?
- Why is this choice significant for the characters?
- What are the potential consequences?
- How does this moment feel natural and earned?

End this page at the perfect moment for the reader to make a meaningful choice about what happens next.`,
        choices: [
          {
            id: "choice-1a",
            text: "[Write first choice option]",
            nextNodeId: "path-a-node"
          },
          {
            id: "choice-1b",
            text: "[Write second choice option]",
            nextNodeId: "path-b-node"
          }
        ]
      }
    ]
  };
};

// Example: Creating a coffee shop story
export const coffeeShopTemplate: StoryDefinition = createStoryTemplate(
  "coffee-shop-romance",
  "Late Night Brew",
  "Two night owls find connection over coffee and conversation.",
  "lgbt",
  2
);

// Example: Creating a workplace story
export const officeTemplate: StoryDefinition = {
  story: {
    title: "After Hours",
    description: "Working late leads to unexpected workplace connections.",
    imageUrl: "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?w=800&h=450&fit=crop",
    spiceLevel: 2,
    category: "lgbt",
    wordCount: 9000,
    pathCount: 6,
    isFeatured: false,
    isPublished: true
  },
  pages: [
    {
      id: "start",
      title: "Chapter 1: Overtime",
      content: `The office building was nearly empty at 9 PM, just the hum of computers and the distant sound of the cleaning crew working their way up from the lower floors. Most of the marketing team had left hours ago, but Alex remained at their desk, squinting at spreadsheets under the harsh fluorescent lights.

The quarterly presentation was tomorrow, and despite weeks of preparation, something still felt off about the numbers. Alex had always been meticulous about their work—maybe too meticulous, according to some colleagues—but this presentation could make or break their chances for the promotion they'd been working toward for two years.

The coffee from this afternoon had long since worn off, leaving behind that familiar late-evening crash that made everything seem more difficult than it actually was. Alex stretched their neck, hearing it crack, and glanced around the empty office space. The usual bustle of phone calls, keyboard clicking, and casual conversations had been replaced by an almost eerie quiet.

That's when they heard it—the soft sound of someone else typing, coming from the direction of the design department. Alex had assumed they were the only one still here, apart from security. Curiosity getting the better of them, they decided to investigate, if only to take a break from the spreadsheets that were starting to blur together.

Walking through the maze of cubicles, Alex followed the sound to its source and found Jordan, the newest member of the design team, hunched over their workstation with the focused intensity of someone completely absorbed in their task.`,
      isStarting: true,
      nextPage: "page-2"
    },
    {
      id: "page-2",
      title: "Chapter 2: Night Shift Partners",
      content: `"I thought I was the only workaholic crazy enough to still be here," Alex said softly, not wanting to startle Jordan.

Jordan looked up, pushing their glasses up their nose in a gesture that Alex had noticed they did when concentrating. Their workstation was covered with design mockups, color swatches, and several empty energy drink cans—evidence of a long creative process.

"Oh, hey Alex," Jordan said, saving their work quickly. "I didn't realize anyone else was still around. I got into this design flow state around seven and completely lost track of time." They gestured at their screen, which displayed what looked like a brilliant new layout for the company's upcoming product launch.

Alex moved closer to get a better look, impressed by the clean lines and innovative use of color. Jordan's work had been consistently excellent since they'd joined the team three months ago, but this was exceptional even by their standards. 

"This is incredible," Alex said, genuinely amazed. "The way you've integrated the branding elements while keeping it modern and accessible—this is exactly what the client presentation needs."

Jordan's face lit up at the praise, and Alex noticed the way their eyes crinkled slightly when they smiled. It was a detail they'd observed before during team meetings, though they'd never been alone with Jordan long enough to appreciate it properly.

"Thanks. I've been struggling with it for hours, but something clicked around eight-thirty." Jordan leaned back in their chair, suddenly aware of how long they'd been sitting. "What about you? Still wrestling with those budget projections?"

The fact that Jordan remembered what Alex was working on surprised them. In a company of over two hundred people, most coworkers barely kept track of their own projects, let alone others'.`,
      nextPage: "page-3"
    },
    {
      id: "page-3",
      title: "Chapter 3: Creative Collaboration",
      content: `"Yeah, the numbers are right, but the presentation feels flat," Alex admitted, running a hand through their hair. "It's all very logical and correct, but it doesn't tell a story. It doesn't make people care about what we're proposing."

Jordan nodded thoughtfully. "That's always the challenge, isn't it? Making data feel human." They paused, then added, "Want me to take a look? Sometimes a fresh perspective helps, and I'm pretty good at finding ways to visualize complex information."

Alex hesitated. They'd always been protective of their work, preferring to solve problems independently rather than risk someone else's input muddling their vision. But something about Jordan's approach—the way they'd described making data feel human—resonated with exactly what was missing from the presentation.

"I'd actually really appreciate that," Alex said, surprised by their own willingness to collaborate. "But only if you're not too tired. You've clearly been working just as hard as I have."

"Are you kidding? This is the most awake I've felt all day," Jordan said, standing up and stretching. "Creative work energizes me, especially when it's collaborative. Plus, your budget projections support my design work—if your presentation succeeds, my designs get implemented. We're on the same team."

They walked back to Alex's workstation together, and Jordan pulled up a chair beside Alex's desk. The proximity felt charged with professional excitement and something else—an awareness of each other that went beyond work concerns.

"Okay, walk me through what you have so far," Jordan said, leaning forward to look at Alex's screen. The scent of their shampoo—something clean and subtle—mixed with the lingering aroma of coffee and the particular smell of late-night office work.

As Alex began explaining the budget breakdown, Jordan asked insightful questions that revealed not just design expertise, but a genuine understanding of business strategy that Alex hadn't expected from someone so new to the company.`,
      nextPage: "page-4"
    },
    {
      id: "page-4",
      title: "Chapter 4: After Midnight Insights",
      content: `For the next two hours, they worked together with an ease that felt both professional and personal. Jordan had a gift for taking Alex's complex financial data and suggesting ways to present it that told a compelling story rather than just listing facts. They sketched rough layouts on scratch paper, proposed color schemes that would make the budget categories more intuitive, and helped Alex restructure the entire flow of the presentation.

"What if we start with the desired outcome and work backward?" Jordan suggested around midnight, reaching across Alex to point at a particular slide. "Instead of building up to the budget request, we show them the success story first, then reveal how the investment makes it possible."

Alex felt a spark of recognition—that moment when a good idea clicks into place. "That's brilliant. It's like... we're selling them a vision, not asking for money."

"Exactly! People buy dreams, not spreadsheets," Jordan said, their enthusiasm infectious. They'd moved their chair closer during their collaboration, and now their shoulders were almost touching as they both leaned forward to look at the screen.

The building around them had grown even quieter as the night deepened. Even the cleaning crew had finished and gone home, leaving just the two of them in their pool of desk light surrounded by the darkened office. The intimacy of the situation wasn't lost on either of them—the shared focus, the late hour, the way their professional collaboration had evolved into something that felt more personal and meaningful than either had expected.

"I can't believe how much better this is than what I had before," Alex said, scrolling through the restructured presentation. "You've completely transformed it. I don't know how to thank you."

Jordan turned to face Alex more directly, and for a moment the work was forgotten. "I had fun. It's been a while since I've gotten to collaborate with someone who really gets both the creative and analytical sides of what we do."

The air between them seemed charged with possibility—professional respect that was teetering on the edge of something more personal.`,
      nextPage: "page-5"
    },
    {
      id: "page-5",
      title: "Chapter 5: The Moment of Truth",
      content: `They sat there for a moment in the quiet office, both aware that something had shifted between them over the course of the evening. What had started as two colleagues working late had evolved into something that felt like a genuine connection—intellectual, creative, and increasingly personal.

"We should probably head home," Alex said softly, though they made no move to pack up their things. "It's after midnight, and we both have early meetings tomorrow."

"Probably," Jordan agreed, but they didn't move either. Instead, they looked at Alex with an expression that was hard to read—part professional satisfaction at a job well done, part something warmer and more personal. "Though I have to say, this is the best late night I've had at work. Usually when I stay this late, I'm just stressing alone over design problems."

Alex felt their heart rate pick up slightly. The way Jordan was looking at them, the intimacy of their shared workspace, the quiet building around them—it all contributed to a moment that felt suspended between professional and personal, between safe colleague interaction and something riskier and more exciting.

"Jordan," Alex began, then paused, unsure how to voice what they were feeling. The presentation was finished, technically speaking. They could both go home now with the satisfaction of work well done. But the idea of ending this connection, of going back to brief hallway conversations and formal team meetings, felt like a missed opportunity.

Jordan leaned slightly closer, close enough that Alex could see the flecks of green in their brown eyes, close enough to notice the way their lips curved in a small, encouraging smile.

"Yeah?" Jordan said quietly, and in that single word was an invitation—permission to make this moment about more than just work, if Alex was brave enough to take it.

The office building hummed quietly around them, and Alex realized they were at a crossroads that could change everything about how they related to each other, and possibly how they felt about coming to work every day.`,
      choices: [
        {
          id: "choice-1a",
          text: "Suggest getting coffee together to continue the conversation somewhere more comfortable",
          nextNodeId: "coffee-continuation"
        },
        {
          id: "choice-1b",
          text: "Acknowledge the connection directly and see where the moment leads",
          nextNodeId: "office-intimacy",
          isPremium: true,
          diamondCost: 35
        }
      ]
    }
  ]
};

// Quick story creation helper
export const createQuickStory = (
  storyId: string,
  title: string,
  description: string,
  pages: { title: string; content: string }[]
): StoryDefinition => {
  const storyPages = pages.map((page, index) => ({
    id: index === 0 ? "start" : `page-${index + 1}`,
    title: page.title,
    content: page.content,
    isStarting: index === 0,
    nextPage: index < pages.length - 1 ? (index === 0 ? "page-2" : `page-${index + 2}`) : undefined,
    choices: index === pages.length - 1 ? [
      {
        id: "choice-1a",
        text: "Continue with first option",
        nextNodeId: "path-a"
      },
      {
        id: "choice-1b", 
        text: "Choose second path",
        nextNodeId: "path-b"
      }
    ] : undefined
  }));

  return {
    story: {
      title,
      description,
      imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop",
      spiceLevel: 1,
      category: "lgbt",
      wordCount: pages.length * 400,
      pathCount: 2,
      isFeatured: false,
      isPublished: true
    },
    pages: storyPages
  };
};