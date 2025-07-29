import type { Story, StoryNode, StoryChoice } from "@shared/schema";

export interface StoryDefinition {
  story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>;
  pages: StoryPageDefinition[];
}

export interface StoryPageDefinition {
  id: string;
  title: string;
  content: string;
  isPremium?: boolean;
  isStarting?: boolean;
  choices?: ChoiceDefinition[];
  nextPage?: string; // For linear progression before choices
}

export interface ChoiceDefinition {
  id: string;
  text: string;
  nextNodeId: string;
  isPremium?: boolean;
  diamondCost?: number;
}

export class StoryManager {
  private stories: Map<string, StoryDefinition> = new Map();

  constructor() {
    this.loadSampleStories();
  }

  // Add a new story to the system
  addStory(storyId: string, definition: StoryDefinition): void {
    this.stories.set(storyId, definition);
  }

  // Get all stories
  getAllStories(): Story[] {
    return Array.from(this.stories.entries()).map(([id, def]) => ({
      id,
      ...def.story,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Get a specific story
  getStory(storyId: string): Story | undefined {
    const definition = this.stories.get(storyId);
    if (!definition) return undefined;

    return {
      id: storyId,
      ...definition.story,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Get a story page/node
  getStoryNode(nodeId: string): StoryNode | undefined {
    for (const [storyId, definition] of this.stories.entries()) {
      const page = definition.pages.find(p => p.id === nodeId);
      if (page) {
        return {
          id: page.id,
          storyId,
          title: page.title,
          content: page.content,
          isStarting: page.isStarting || false,
          order: definition.pages.indexOf(page) + 1,
          createdAt: new Date()
        };
      }
    }
    return undefined;
  }

  // Get starting node for a story
  getStartingNode(storyId: string): StoryNode | undefined {
    const definition = this.stories.get(storyId);
    if (!definition) return undefined;

    const startPage = definition.pages.find(p => p.isStarting) || definition.pages[0];
    if (!startPage) return undefined;

    return {
      id: startPage.id,
      storyId,
      title: startPage.title,
      content: startPage.content,
      isStarting: true,
      order: 1,
      createdAt: new Date()
    };
  }

  // Get choices for a node
  getChoicesFromNode(nodeId: string): StoryChoice[] {
    for (const [storyId, definition] of this.stories.entries()) {
      const page = definition.pages.find(p => p.id === nodeId);
      if (page && page.choices) {
        return page.choices.map((choice, index) => ({
          id: choice.id,
          fromNodeId: nodeId,
          toNodeId: choice.nextNodeId,
          choiceText: choice.text,
          order: index + 1,
          isPremium: choice.isPremium || false,
          diamondCost: choice.diamondCost || 0,
          createdAt: new Date()
        }));
      }
    }
    return [];
  }

  // Get a specific choice
  getStoryChoice(choiceId: string): StoryChoice | undefined {
    for (const [storyId, definition] of this.stories.entries()) {
      for (const page of definition.pages) {
        if (page.choices) {
          const choice = page.choices.find(c => c.id === choiceId);
          if (choice) {
            return {
              id: choice.id,
              fromNodeId: page.id,
              toNodeId: choice.nextNodeId,
              choiceText: choice.text,
              order: 1,
              isPremium: choice.isPremium || false,
              diamondCost: choice.diamondCost || 0,
              createdAt: new Date()
            };
          }
        }
      }
    }
    return undefined;
  }

  // Get next page in linear progression
  getNextPage(storyId: string, currentPageId: string): StoryNode | undefined {
    const definition = this.stories.get(storyId);
    if (!definition) return undefined;

    const currentPage = definition.pages.find(p => p.id === currentPageId);
    if (!currentPage || !currentPage.nextPage) return undefined;

    return this.getStoryNode(currentPage.nextPage);
  }

  // Load sample stories
  private loadSampleStories(): void {
    // Campus Encounter Story
    this.addStory('campus-encounter', {
      story: {
        title: "Campus Encounter",
        description: "A late-night library meeting leads to unexpected connections and philosophical discoveries.",
        imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop",
        spiceLevel: 2,
        category: "lgbt",
        wordCount: 8500,
        pathCount: 6,
        isFeatured: true,
        isPublished: true
      },
      pages: [
        {
          id: "start",
          title: "Chapter 1: The Night Shift",
          content: `The rain drummed against the library windows as Jake hunched over his economics textbook. It was nearly midnight, and Sterling University's main library had transformed from a bustling hub of academic activity into a cathedral of quiet desperation. The fluorescent lights cast harsh shadows across empty tables, and the occasional rustle of pages turning echoed through the vast halls like whispered secrets.

Jake had been there since six in the evening, surrounded by a fortress of textbooks, energy drink cans, and crumpled notes. His economics final was tomorrow morning, and Professor Hartwell had a reputation for creating exams that could crush even the most prepared students. Market equilibrium theories swam before his eyes in a blur of supply and demand curves that made less sense with each passing hour.

The stress was getting to him. His shoulders ached from hunching over his desk, his eyes burned from staring at the same diagrams for hours, and his mind kept wandering to everything except microeconomic theory. The coffee shop on campus had closed hours ago, and even the vending machines seemed to mock him with their selection of overpriced caffeine and sugar.

Jake stretched, rolling his shoulders and trying to work out the knots that had formed from hours of poor posture. Around him, the library felt like a different world after closing time. During the day, it buzzed with conversations, the click of keyboards, and the constant shuffle of students moving between floors. But now, it was just him, the security guard making his rounds somewhere in the distance, and the occasional graduate student lost in their research.`,
          isStarting: true,
          nextPage: "page-2"
        },
        {
          id: "page-2",
          title: "Chapter 2: The Visitor",
          content: `Jake forced himself to look back at his textbook, but the words seemed to blur together. Supply and demand, elasticity of goods, consumer behavior – it all felt abstract and meaningless when he was this exhausted. His stomach growled, reminding him that he'd skipped dinner in his rush to claim a good study spot.

He was just considering taking a break when he heard footsteps approaching his table. These weren't the heavy, measured steps of the security guard he'd grown accustomed to hearing every hour or so. These were lighter, more purposeful, accompanied by the soft rustle of fabric and what sounded like the gentle clink of ceramic.

Jake looked up, and his breath caught in his throat. Alex Chen was walking toward his table, carrying a worn leather messenger bag and what appeared to be a thermos. Jake had noticed Alex in Professor Martinez's Philosophy of Existence class – it was hard not to. Alex had this way of contributing to discussions that made even the most complex philosophical concepts seem accessible and relevant.

While other students, including Jake, often stumbled through their responses or recited textbook definitions, Alex spoke with a natural eloquence that suggested they genuinely understood the material on a deeper level. Their questions were always thoughtful, building on what others had said rather than simply showing off their own knowledge.

Jake had wanted to talk to Alex all semester, but Philosophy 301 was one of those classes where everyone seemed to have already formed their study groups and friend circles. Jake had been too intimidated by Alex's obvious intelligence and the way they seemed to effortlessly navigate both the academic and social aspects of university life.

"Mind if I sit here?" Alex asked, their voice warm and surprisingly gentle. "I know it's late, but everywhere else seems to be taken by people's abandoned stuff, and I really need to get some reading done."`,
          nextPage: "page-3"
        },
        {
          id: "page-3",
          title: "Chapter 3: An Unexpected Connection",
          content: `"Of course," Jake managed, gesturing to the empty chair across from him. "There's plenty of room."

As Alex settled into the chair, pulling out their own collection of books and notes, Jake noticed the title of the book on top of their stack: Albert Camus' "The Stranger." It was clearly well-loved, with Post-it notes sticking out from various pages and margins filled with handwritten annotations.

"Philosophy homework?" Jake asked, nodding toward the book.

Alex laughed softly, a sound that seemed to make the sterile library atmosphere feel instantly warmer. "In a way. I'm working on my senior thesis about existentialism in contemporary literature. Camus is fascinating – there's something about his approach to the absurd that feels especially relevant right now."

Jake found himself leaning forward slightly, genuinely interested despite his exhaustion. "The absurd as in life being meaningless?"

"Not meaningless exactly," Alex said, their eyes lighting up with the kind of enthusiasm that only came from discussing something you truly loved. "More like... life doesn't have some predetermined purpose handed down from above, but that doesn't make it meaningless. Camus argues that we create meaning through our choices and actions, even – especially – when we're aware that existence is fundamentally absurd."

There was something infectious about Alex's passion for the subject. Jake had always found philosophy intimidating, full of abstract concepts that seemed disconnected from real life. But the way Alex explained it made it feel immediate and personal.

"That's actually kind of comforting," Jake said, surprising himself. "I mean, I'm sitting here panicking about an economics exam, wondering if any of this actually matters in the grand scheme of things. But if we create our own meaning..."

"Then your choice to care about doing well, to push yourself, to stay here until midnight studying – that creates meaning," Alex finished. "Even if the exam itself feels arbitrary."`,
          nextPage: "page-4"
        },
        {
          id: "page-4",
          title: "Chapter 4: Shared Understanding",
          content: `Jake felt something shift in his chest, a loosening of the tight knot of anxiety that had been building all day. He looked at Alex with new appreciation, not just for their intelligence but for their ability to make him see his own situation from a completely different angle.

"What's your exam on?" Alex asked, glancing at Jake's collection of economics materials with what seemed like genuine interest rather than the polite inquiry Jake was used to from other students.

"Microeconomic theory," Jake said with a self-deprecating smile. "Supply and demand curves, market equilibrium, consumer behavior. It's Professor Hartwell's class, so it's guaranteed to be brutal."

Alex winced sympathetically. "Hartwell has quite the reputation. My roommate took his class last year and basically lived in the library for the entire final exam period."

"That's encouraging," Jake laughed, but there was real gratitude in his voice for Alex's understanding. Most people either dismissed economics as boring or assumed it was easy because it dealt with "real world" concepts. Alex seemed to grasp that it was its own kind of complex beast.

"I actually find economics fascinating from a philosophical perspective," Alex continued, settling more comfortably in their chair. "All those models and theories are really just attempts to understand human behavior on a massive scale. Like, what makes people choose one thing over another? How do individual decisions create larger patterns? It's not that different from what existentialists were asking about individual choice and meaning."

Jake stared at Alex, feeling like he was seeing his major from a completely new angle. He'd always thought of economics as dry and mathematical, focused on graphs and formulas rather than the human element. But Alex was right – underneath all the technical language, economics was really about understanding people.

The rain continued its steady rhythm against the windows, and the library felt less lonely now, charged with the possibility of genuine connection and intellectual discovery.`,
          nextPage: "page-5"
        },
        {
          id: "page-5",
          title: "Chapter 5: The First Choice",
          content: `"I never thought about it that way," Jake said. "Professor Hartwell makes it seem like it's all about memorizing formulas and being able to calculate equilibrium points."

"Well, you probably need to know the formulas for the exam," Alex said with a practical smile. "But understanding the human element might help the concepts stick better. Mind if I look at what you're working on? Sometimes a fresh perspective helps."

Jake felt his pulse quicken slightly. The idea of Alex looking at his notes, maybe leaning closer to see his textbook, sitting together and actually collaborating – it was both exciting and nerve-wracking. But Alex's offer seemed genuine, and Jake was definitely in need of a new approach to the material.

"Sure," he said, turning his textbook so Alex could see it better. "I'm supposed to understand how consumer surplus changes when market prices shift, but honestly, it's all starting to look like hieroglyphics."

As Alex leaned forward to examine the diagrams, Jake caught a subtle scent of coffee and something that might have been vanilla. The proximity made him acutely aware of how intimate this moment felt, despite being in a public space.

"Okay, so think about it this way," Alex said, their finger tracing one of the curves in Jake's textbook. "This isn't just a graph – it's a map of human desire and limitation. Every point represents someone making a choice about what they can afford versus what they want."

Jake found himself focusing not just on Alex's words, but on the gentle way their finger moved across the page, the concentration in their expression, the way the library's soft lighting caught the highlights in their hair.

The moment stretched between them, full of academic collaboration and something deeper, more personal. Jake realized he was at a crossroads – not just in understanding economics, but in deciding how to navigate this unexpected connection with someone who had already begun to change how he saw the world.`,
          choices: [
            {
              id: "choice-1a",
              text: "Ask Alex to continue helping you study and share more of their insights",
              nextNodeId: "study-collaboration"
            },
            {
              id: "choice-1b",
              text: "Suggest taking a break and getting to know each other better",
              nextNodeId: "personal-connection"
            }
          ]
        }
      ]
    });

    // Midnight Coffee Story
    this.addStory('midnight-coffee', {
      story: {
        title: "Midnight Coffee",
        description: "Working late at the coffee shop, Sam never expected the regular customer to change everything.",
        imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop",
        spiceLevel: 1,
        category: "lgbt",
        wordCount: 7200,
        pathCount: 4,
        isFeatured: false,
        isPublished: true
      },
      pages: [
        {
          id: "start",
          title: "Chapter 1: After Hours",
          content: `The coffee shop felt different at night. During the day, Grind & Brew buzzed with students typing frantically on laptops and business people grabbing quick caffeine fixes before rushing back to their lives. But after 11 PM, it transformed into something quieter, more intimate – a refuge for night owls and insomniacs seeking both caffeine and human connection.

Sam had been working the closing shift for six months now, and had grown to love these late hours. The soft jazz playing from the speakers, the warm glow of the pendant lights casting golden circles on the worn wooden tables, the way the street looked through the rain-streaked windows – it created an atmosphere that felt more like a cozy living room than a commercial establishment.

The regular daytime crowd had long since disappeared, replaced by a smaller, more eclectic group of nighttime regulars. There was Marcus, the graduate student who came in at 10:30 every Tuesday and Thursday to work on his dissertation; Elena, the nurse who stopped by after her shift at the hospital for a decaf and a moment of quiet; and a handful of others who had become familiar faces in Sam's nocturnal world.

But tonight felt different. Maybe it was the rain that had been falling steadily since dinner time, creating a cocoon-like atmosphere that made the outside world seem distant and irrelevant. Or maybe it was the way the empty streets reflected the neon signs from the shops across the way, painting everything in blues and reds that shifted with each passing car.

Sam wiped down the counter for what felt like the hundredth time, more out of nervous energy than necessity. The coffee shop was spotless – had been for the past hour – but the familiar motions were soothing. Wipe in circles, rinse the cloth, wipe again. It was meditative in its repetition.`,
          isStarting: true,
          nextPage: "page-2"
        },
        {
          id: "page-2",
          title: "Chapter 2: The Regular",
          content: `Sam glanced at the clock above the espresso machine: 11:47 PM. Just thirteen more minutes until closing, and then they could finally head home to their small apartment above the bookstore next door. Maybe they'd read for a while, or catch up on the podcast they'd been meaning to finish.

That's when the bell above the door chimed, and Sam looked up to see River walking in from the rain. River was one of the most reliable regulars – had been coming here for months, always ordering the same thing: a double espresso, no sugar, extra hot. They usually arrived around this time, just before closing, as if they preferred the quieter atmosphere of the nearly empty shop.

But tonight, River looked different. Their usual confident stride had been replaced by uncertain steps, and instead of their typical focused expression – the look of someone who knew exactly what they wanted and where they were going – there was something vulnerable in their demeanor.

River had always intrigued Sam. They clearly worked late hours, judging by their schedule, and always carried a leather portfolio that suggested some kind of creative profession. Sam had caught glimpses of sketches and what looked like architectural drawings, but had never felt comfortable asking directly. Their interactions had always been friendly but brief – the polite exchange between service worker and customer, punctuated by genuine smiles and the occasional comment about the weather.

Sam had often wondered about River's life outside these brief midnight encounters. Did they live alone? What kept them up so late that they needed espresso at nearly midnight? Were they happy? Tonight, looking at River's unusually hesitant posture, Sam found themselves more curious than ever.

"Hey," River said softly, approaching the counter with an uncharacteristic hesitation. "I know you're about to close, but..." They trailed off, looking down at their hands.

Sam had never seen River look uncertain about anything. It was both concerning and endearing, this glimpse of vulnerability from someone who usually projected such quiet confidence.`,
          nextPage: "page-3"
        },
        {
          id: "page-3",
          title: "Chapter 3: Something Different",
          content: `"Don't worry about it," Sam said warmly, setting down the cloth they'd been using. "I'm in no hurry. The usual?"

But River shook their head, surprising them both. In all the months they'd been coming here, River had never deviated from their order. Sam had their routine memorized: start the espresso as soon as River walked in, pull it extra hot, serve it in the blue ceramic cup that River seemed to prefer over the white ones.

"Actually..." River paused, seeming to gather their courage. "Could I get something sweet tonight? Maybe a caramel latte?"

Sam paused, espresso portafilter halfway to the machine. The request was so unexpected that it took a moment to process. River asking for something sweet was like... well, like someone fundamentally changing who they were. It seemed to represent something larger, some shift that Sam couldn't quite understand but could definitely sense.

"Of course," Sam said, setting down the portafilter and reaching for a larger cup. "Rough day?"

River let out a laugh that sounded almost like a sigh. "You could say that." They leaned against the counter, a gesture that was also new. Usually River maintained a polite distance, conducting their transaction efficiently before finding a table. This casual pose suggested they wanted to talk, maybe even needed to.

"I got some news today," River continued, their voice quieter now. "Nothing terrible, just... life-changing, you know? The kind of thing that makes you question all your assumptions about what you want and where you're going."

Sam began working the espresso machine, but more slowly than usual, sensing that River needed this moment to unfold naturally. The familiar sounds of steaming milk and brewing coffee created a comforting backdrop to what felt like the beginning of a much deeper conversation.

"Sometimes life just throws you a curveball when you least expect it," Sam offered, focusing on creating the perfect foam while keeping their tone conversational and non-intrusive.`,
          nextPage: "page-4"
        },
        {
          id: "page-4",
          title: "Chapter 4: Unexpected Intimacy",
          content: `River nodded, watching Sam's practiced movements with what seemed like genuine interest. "Exactly. I've had my whole career path mapped out since college, you know? Five-year plan, ten-year plan, the works. And then today..." They gestured vaguely, as if the words were too big to capture.

Sam finished preparing the latte, taking extra care with the foam art – something they rarely did for regular orders, but tonight felt special somehow. The result was a delicate leaf pattern that seemed almost too pretty to drink.

"Here," Sam said, sliding the cup across the counter. "On the house. Sounds like you could use some sweetness tonight."

River's eyes widened slightly at the gesture, and when they reached for the cup, their fingers brushed against Sam's for just a moment. The contact was brief but electric, sending a small shock of awareness through both of them.

"Thank you," River said, their voice softer now. "I mean, really. You have no idea how much I needed this tonight."

The coffee shop felt smaller suddenly, the distance between them compressed by the weight of shared vulnerability. Sam realized they'd been holding their breath and let it out slowly, aware that something significant was happening – some shift in the dynamic that had defined their interactions for months.

"Would you like to sit?" Sam asked, gesturing toward the small cluster of tables near the window. "I mean, I still have a few minutes before I need to lock up, and..." They paused, surprised by their own boldness. "And you look like you might want to talk about whatever happened today."

River looked at Sam for a long moment, as if weighing options that went far beyond simply choosing where to drink their coffee. The rain continued its steady rhythm against the windows, creating a cocoon of privacy around them.

"I'd like that," River said finally. "I'd like that a lot."`,
          nextPage: "page-5"
        },
        {
          id: "page-5",
          title: "Chapter 5: The First Choice",
          content: `Sam came around the counter, feeling suddenly self-conscious about the small distance they were closing between themselves and River. This was uncharted territory – in all their months of brief, friendly exchanges, they'd never shared space like this, never moved beyond the safe boundaries of customer and barista.

River chose a table by the window, setting down their latte and looking out at the rain-soaked street. The warm light from inside created a golden reflection that made their profile appear almost ethereal against the dark glass.

"So," Sam said, settling into the chair across from them, "what kind of life-changing news makes someone switch from espresso to caramel lattes?"

River laughed, and this time it sounded more genuine, less weighted with whatever burden they'd been carrying. "You're going to think it's silly."

"Try me."

River took a sip of their latte, closing their eyes briefly as if savoring not just the taste but the moment itself. "I got offered a job today. A really good job. The kind of opportunity I've been working toward my entire career." They opened their eyes and met Sam's gaze. "But it's in Seattle. I'd have to leave in three weeks."

Sam felt something twist in their chest – a reaction that surprised them with its intensity. They'd grown more attached to these midnight encounters than they'd realized, more invested in River as a person than simple professional courtesy required.

"That's... that's amazing," Sam said, trying to keep their voice steady. "Congratulations. It sounds like exactly what you've been working for."

"It is," River agreed, but their tone suggested complications that went beyond simple career decisions. "The thing is, I realized today that leaving would mean giving up things I didn't even know I valued. This place, for instance." They gestured around the coffee shop. "These late-night conversations I've been having with myself while you make my coffee. The routine. The..."

They trailed off, but their eyes remained fixed on Sam's, full of unspoken meaning.

The moment stretched between them, heavy with possibility and the weight of choices that could change everything.`,
          choices: [
            {
              id: "choice-1a",
              text: "Tell River how much you'd miss these midnight visits",
              nextNodeId: "emotional-honesty"
            },
            {
              id: "choice-1b",
              text: "Ask River what they really want, beyond career success",
              nextNodeId: "deeper-questions"
            }
          ]
        }
      ]
    });
  }
}

// Export singleton instance
export const storyManager = new StoryManager();