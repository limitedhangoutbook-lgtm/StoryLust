// Unified story management system
// This replaces the fragmented choice/node system with a cohesive story structure

export interface UnifiedStoryPage {
  id: string;
  title: string;
  content: string;
  choices?: UnifiedStoryChoice[];
  isEnding?: boolean;
  endingType?: string;
}

export interface UnifiedStoryChoice {
  id: string;
  text: string;
  nextPageId: string;
  isPremium?: boolean;
  diamondCost?: number;
}

export interface UnifiedStory {
  id: string;
  title: string;
  description: string;
  spiceLevel: number;
  category: string;
  pages: UnifiedStoryPage[];
}

export const unifiedStories: UnifiedStory[] = [
  {
    id: "campus-encounter",
    title: "Campus Encounter",
    description: "A chance meeting at university leads to unexpected chemistry between two students from different worlds.",
    spiceLevel: 2,
    category: "straight",
    pages: [
      {
        id: "start",
        title: "The Night Shift",
        content: `The rain drummed against the library windows as Jake hunched over his economics textbook. It was nearly midnight, and Sterling University's main library had transformed from a bustling hub of academic activity into a cathedral of quiet desperation.

Jake had been there since six in the evening, surrounded by a fortress of textbooks, energy drink cans, and crumpled notes. His economics final was tomorrow morning, and Professor Hartwell had a reputation for creating exams that could crush even the most prepared students.

The stress was getting to him. His shoulders ached from hunching over his desk, his eyes burned from staring at the same diagrams for hours, and his mind kept wandering to everything except microeconomic theory.`
      },
      {
        id: "page-2",
        title: "The Visitor",
        content: `Jake forced himself to look back at his textbook, but the words seemed to blur together. Supply and demand, elasticity of goods, consumer behavior – it all felt abstract and meaningless when he was this exhausted.

He was just considering taking a break when he heard footsteps approaching his table. These weren't the heavy, measured steps of the security guard he'd grown accustomed to hearing every hour or so. These were lighter, more purposeful.

Jake looked up, and his breath caught in his throat. Alex Chen was walking toward his table, carrying a worn leather messenger bag and what appeared to be a thermos. Jake had noticed Alex in Professor Martinez's Philosophy of Existence class – it was hard not to.`
      },
      {
        id: "page-3",
        title: "An Unexpected Connection",
        content: `"Mind if I sit here?" Alex asked, their voice warm and surprisingly gentle. "I know it's late, but everywhere else seems to be taken by people's abandoned stuff."

"Of course," Jake managed, gesturing to the empty chair across from him. "There's plenty of room."

As Alex settled into the chair, pulling out their own collection of books and notes, Jake noticed the title of the book on top of their stack: Albert Camus' "The Stranger." It was clearly well-loved, with Post-it notes sticking out from various pages.

"Philosophy homework?" Jake asked, nodding toward the book.

Alex laughed softly, a sound that seemed to make the sterile library atmosphere feel instantly warmer. "Working on my senior thesis about existentialism in contemporary literature."`
      },
      {
        id: "page-4",
        title: "Building Chemistry",
        content: `"That sounds fascinating," Jake said, and to his surprise, he genuinely meant it. "I'm stuck in the world of supply curves and market equilibrium."

"Economics?" Alex's eyes lit up with interest rather than the usual glazed look most people got when he mentioned his major. "Actually, that's not as far from philosophy as you might think. Both deal with understanding human behavior and decision-making."

Jake found himself leaning forward, his economics textbook momentarily forgotten. "I never thought about it that way."

"Think about it – economic theories are basically philosophical frameworks for understanding how people make choices when resources are limited. Scarcity, utility, rational decision-making... it's all about the human condition."

For the first time all evening, Jake felt his mind engaging with something other than exam anxiety.`
      },
      {
        id: "page-5",
        title: "A Critical Moment",
        content: `As the night wore on, Jake found himself stealing glances at Alex between study sessions. There was something captivating about the way Alex's brow furrowed in concentration, the way they absently tucked a strand of hair behind their ear while reading.

When Alex's thermos ran empty, they sighed softly. "I should probably head to the 24-hour cafe to refill this," they said, holding up the empty container. "My brain doesn't function without caffeine after midnight."

Jake's heart rate picked up. This felt like a moment that could change everything – or nothing at all, depending on what he did next. He could feel the weight of possibility hanging in the air between them.`,
        choices: [
          {
            id: "choice-offer-walk",
            text: "Offer to walk Alex to the cafe and keep them company",
            nextPageId: "path-cafe-walk"
          },
          {
            id: "choice-stay-study",
            text: "Stay focused on studying and let the moment pass",
            nextPageId: "path-study-alone"
          },
          {
            id: "choice-ask-number",
            text: "Ask for Alex's number before they leave",
            nextPageId: "path-exchange-numbers",
            isPremium: true,
            diamondCost: 3
          }
        ]
      },
      // Branching paths
      {
        id: "path-cafe-walk",
        title: "Late Night Walk",
        content: `"Mind if I join you?" Jake heard himself saying before he could second-guess it. "I could use a break, and the fresh air might help clear my head."

Alex's face lit up with a genuine smile. "I'd like that. The campus is actually really beautiful at this time of night – there's something peaceful about it when it's not crowded with students."

They packed up their things and headed out into the cool night air. The rain had stopped, leaving the campus walkways glistening under the streetlights. Their footsteps echoed softly as they walked side by side toward the 24-hour cafe.

"You know," Alex said, "I was hoping you'd say something like that."`,
        choices: [
          {
            id: "choice-open-up",
            text: "Open up about your feelings and the connection you've felt",
            nextPageId: "path-confession"
          },
          {
            id: "choice-coffee-shop",
            text: "Suggest getting coffee together and talking more",
            nextPageId: "path-coffee-date"
          },
          {
            id: "choice-intimate-moment",
            text: "Create an intimate moment under the starlight",
            nextPageId: "path-romantic-tension",
            isPremium: true,
            diamondCost: 5
          }
        ]
      },
      {
        id: "path-study-alone",
        title: "Missed Opportunity",
        content: `Jake watched Alex pack up their things, a dozen different things he wanted to say stuck in his throat. The moment stretched between them, full of unspoken possibilities.

"Well, good luck with your exam tomorrow," Alex said, shouldering their bag. "Maybe I'll see you around campus."

"Yeah," Jake managed. "Good luck with your thesis."

Alex gave him one last smile – was there a hint of disappointment in it? – and walked away. Jake was left alone with his economics textbook and the growing feeling that he'd just let something important slip through his fingers.

He tried to refocus on his studies, but his mind kept wandering to what might have been.`,
        isEnding: true,
        endingType: "missed-opportunity"
      },
      {
        id: "path-exchange-numbers",
        title: "Taking a Chance",
        content: `"Wait," Jake said, his voice coming out more confident than he felt. "Before you go... would you maybe want to grab coffee sometime? When we're not both drowning in coursework?"

Alex paused at the edge of the table, their expression shifting to something Jake couldn't quite read. For a moment, he worried he'd completely misread the situation.

Then Alex smiled – a real, warm smile that made Jake's pulse quicken. "I was wondering if you were going to ask." They pulled out their phone. "Here, give me your number."

As they exchanged contact information, their fingers briefly touched when Alex handed back Jake's phone. The small contact sent an electric jolt through him.

"Text me," Alex said, eyes holding his for a moment longer than necessary. "I'd really like that coffee."`,
        choices: [
          {
            id: "choice-plan-date",
            text: "Plan a proper coffee date for tomorrow evening",
            nextPageId: "path-first-date"
          },
          {
            id: "choice-suggest-tonight",
            text: "Suggest going for coffee right now, tonight",
            nextPageId: "path-spontaneous-date",
            isPremium: true,
            diamondCost: 4
          }
        ]
      },
      // Additional endings and paths...
      {
        id: "path-confession",
        title: "Heart to Heart",
        content: `"Alex," Jake said, stopping under a streetlight. "I have to tell you something. I've noticed you in Philosophy class all semester, and tonight... sitting with you, talking with you... I feel something I haven't felt in a long time."

Alex turned to face him fully, their expression serious but not unwelcoming. "Jake..."

"I know we barely know each other," he continued, "but there's something about you that just... draws me in. The way you think, the way you see connections between things that seem completely separate. I don't want this night to end."

The silence stretched between them for a moment that felt like eternity. Then Alex stepped closer.

"I was hoping you felt it too," Alex whispered.`,
        isEnding: true,
        endingType: "romantic-confession"
      },
      {
        id: "path-coffee-date",
        title: "The Beginning",
        content: `The campus cafe was nearly empty at this hour, just a few other night owls hunched over laptops and textbooks. Jake and Alex found a corner table by the window, their conversation flowing as easily as if they'd known each other for years.

"So what made you choose economics?" Alex asked, cradling their fresh coffee.

"Honestly? My parents," Jake admitted. "They wanted something 'practical.' But tonight, talking with you about the philosophical aspects... I'm starting to see it differently."

"That's the thing about perspective," Alex said, leaning forward. "Change how you look at something, and everything changes."

Their eyes met across the small table, and Jake felt that same electric connection from the library intensifying.`,
        isEnding: true,
        endingType: "new-beginning"
      }
    ]
  }
];

export function getUnifiedStory(storyId: string): UnifiedStory | undefined {
  return unifiedStories.find(story => story.id === storyId);
}

export function getStoryPage(storyId: string, pageId: string): UnifiedStoryPage | undefined {
  const story = getUnifiedStory(storyId);
  return story?.pages.find(page => page.id === pageId);
}