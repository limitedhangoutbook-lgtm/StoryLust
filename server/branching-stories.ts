// Branching story structure based on user's sketch
// Implements the exact flow shown in the diagram with premium paths and multiple endings

export interface BranchingStoryDefinition {
  id: string;
  title: string;
  description: string;
  spiceLevel: number;
  category: string;
  nodes: BranchingNode[];
}

export interface BranchingNode {
  id: string;
  title: string;
  content: string;
  isPremium?: boolean;
  isEnding?: boolean;
  endingType?: string; // "ending-1", "ending-2", etc.
  choices?: BranchingChoice[];
}

export interface BranchingChoice {
  id: string;
  text: string;
  nextNodeId: string;
  isPremium?: boolean;
  diamondCost?: number;
}

export const branchingStories: BranchingStoryDefinition[] = [
  {
    id: "campus-encounter",
    title: "Campus Encounter", 
    description: "A chance meeting at university leads to unexpected chemistry between two students from different worlds.",
    spiceLevel: 2,
    category: "straight",
    nodes: [
      // Free story progression (5 pages)
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
        title: "Shared Understanding",
        content: `Jake found himself leaning forward, genuinely interested despite his exhaustion. There was something infectious about Alex's passion for philosophy that made even complex concepts feel immediate and personal.

"That's actually kind of comforting," Jake said, surprising himself. "I mean, I'm sitting here panicking about an economics exam, wondering if any of this actually matters."

"What's your exam on?" Alex asked, glancing at Jake's economics materials with genuine interest.

"Microeconomic theory," Jake said with a self-deprecating smile. "Professor Hartwell's class, so it's guaranteed to be brutal."

Alex winced sympathetically. "Hartwell has quite the reputation. My roommate took his class last year and basically lived in the library for the entire final exam period."

The conversation flowed naturally, and Jake felt the tight knot of anxiety in his chest beginning to loosen.`
      },
      {
        id: "page-5",
        title: "The First Choice",
        content: `As the night wore on, Jake found himself stealing glances at Alex between study sessions. There was something captivating about the way Alex's brow furrowed in concentration, the way they absently tucked a strand of hair behind their ear while reading.

When Alex's thermos ran empty, they sighed softly. "I should probably head to the 24-hour cafe to refill this," they said, holding up the empty container. "My brain doesn't function without caffeine after midnight."

Jake's heart rate picked up. This felt like a moment that could change everything – or nothing at all, depending on what he did next. He could feel the weight of possibility hanging in the air between them.

Alex stood up, gathering their things slowly, as if giving Jake time to say something. The library felt even quieter than before, filled with unspoken potential.`,
        choices: [
          {
            id: "choice-offer-walk",
            text: "Offer to walk Alex to the cafe and keep them company",
            nextNodeId: "path-cafe-walk",
            isPremium: false
          },
          {
            id: "choice-stay-study", 
            text: "Stay focused on studying and let the moment pass",
            nextNodeId: "path-study-focused",
            isPremium: false
          }
        ]
      },

      // Choice Path 1: Cafe Walk (Free)
      {
        id: "path-cafe-walk",
        title: "Late Night Walk",
        content: `"Mind if I join you?" Jake heard himself saying before he could second-guess it. "I could use a break, and the fresh air might help clear my head."

Alex's face lit up with a genuine smile. "I'd like that. The campus is actually really beautiful at this time of night – there's something peaceful about it when it's not crowded with students."

They packed up their things and headed out into the cool night air. The rain had stopped, leaving the campus walkways glistening under the streetlights. Their footsteps echoed softly as they walked side by side toward the 24-hour cafe.

"You know," Alex said, "I was hoping you'd say something. I've noticed you in Philosophy class – you ask really thoughtful questions, even when Professor Martinez goes off on those tangents about Nietzsche."

Jake felt warmth spread through his chest. "You noticed me?"`,
        choices: [
          {
            id: "choice-open-up",
            text: "Open up about feeling intimidated by Alex's intelligence",
            nextNodeId: "path-vulnerability",
            isPremium: false
          },
          {
            id: "choice-flirt-back",
            text: "Flirt back and suggest getting coffee together more often",
            nextNodeId: "path-flirtation",
            isPremium: true,
            diamondCost: 5
          }
        ]
      },

      // Choice Path 2: Stay Studying (Free)
      {
        id: "path-study-focused",
        title: "Missed Connections",
        content: `Jake hesitated, his mouth opening and closing without words. The moment stretched between them, full of unspoken possibilities that seemed to slip away with each passing second.

"Well," Alex said finally, their voice still warm but with a hint of disappointment. "I'll see you around, Jake. Good luck with your exam tomorrow."

"Thanks," Jake managed. "Good luck with your thesis."

As Alex walked away, their footsteps fading into the distance, Jake stared down at his textbook. The economic theories that had seemed so important moments ago now felt hollow and meaningless. He'd chosen safety over possibility, and the library felt emptier than ever.

He tried to refocus on his studies, but his mind kept wandering to what might have happened if he'd been braver.`,
        choices: [
          {
            id: "choice-regret-pursue",
            text: "Regret the decision and try to catch up with Alex",
            nextNodeId: "path-second-chance",
            isPremium: false
          },
          {
            id: "choice-accept-focus",
            text: "Accept the choice and focus entirely on the exam",
            nextNodeId: "ending-academic",
            isPremium: false
          }
        ]
      },

      // Premium Path: Flirtation
      {
        id: "path-flirtation",
        title: "Chemistry",
        content: `Jake felt emboldened by Alex's admission. "Well, I've definitely noticed you too. The way you explain complex ideas makes them seem... accessible. And," he added with a smile, "I've been trying to work up the courage to talk to you all semester."

Alex's cheeks flushed slightly in the streetlight. "Really? I thought you might think I was too intense – I know I get carried away when I'm passionate about something."

"That's what I find attractive about you," Jake said, surprised by his own boldness. The night air seemed to make everything feel more possible, more honest.

They'd reached the cafe, but neither seemed eager to go inside. Instead, they lingered outside, the conversation taking on a more intimate tone.

"You know," Alex said, stepping closer, "maybe we could make this a regular thing. Late-night study sessions, coffee runs... getting to know each other better."

The suggestion hung in the air between them, loaded with promise.`,
        choices: [
          {
            id: "choice-kiss-moment",
            text: "Lean in for a spontaneous kiss under the streetlight",
            nextNodeId: "ending-romance",
            isPremium: true,
            diamondCost: 10
          },
          {
            id: "choice-slow-build",
            text: "Suggest meeting for a proper coffee date tomorrow",
            nextNodeId: "ending-relationship",
            isPremium: false
          }
        ]
      },

      // Free Path: Vulnerability 
      {
        id: "path-vulnerability",
        title: "Honest Moments",
        content: `Jake took a deep breath. "To be honest, I've been intimidated by you all semester. You're so articulate in class, and you seem to understand things on this deeper level that I'm not sure I'll ever reach."

Alex stopped walking and turned to face him, their expression softening. "Jake, that's... that's really sweet of you to say. But you sell yourself short. The questions you ask in class show that you're really thinking about the material, not just memorizing it."

"I guess I never thought about it that way."

"That's the thing about philosophy – and maybe life in general," Alex said. "We're all just trying to figure things out as we go. The fact that you're willing to admit uncertainty, to be vulnerable about not knowing something... that takes courage."

They'd reached the cafe, and through the large windows, they could see the warm glow of lights and a few other night-owl students scattered at tables.`,
        choices: [
          {
            id: "choice-continue-talking",
            text: "Suggest sitting together in the cafe to continue talking",
            nextNodeId: "ending-friendship",
            isPremium: false
          },
          {
            id: "choice-personal-share",
            text: "Share something personal about your fears and dreams",
            nextNodeId: "path-deep-connection",
            isPremium: true,
            diamondCost: 8
          }
        ]
      },

      // Premium Path: Deep Connection
      {
        id: "path-deep-connection",
        title: "Soul Connection",
        content: `Something in Alex's understanding tone made Jake feel safe to open up further. "You know, sometimes I wonder if I'm even cut out for university. I chose economics because it seemed practical, but I'm not sure it's what I'm passionate about."

Alex's eyes showed genuine interest and empathy. "What would you choose if practicality wasn't a factor?"

"This might sound silly, but... I've always been fascinated by sustainable architecture. The idea of creating buildings that work with nature instead of against it. But my parents think it's too risky, too idealistic."

"That doesn't sound silly at all," Alex said firmly. "In fact, it sounds like you're grappling with the same existential questions Camus wrote about – how do we live authentically when society pushes us toward conformity?"

The conversation had become deeply personal, and Jake felt a connection forming that went beyond mere attraction. This was understanding on a soul level.`,
        choices: [
          {
            id: "choice-life-changing",
            text: "Decide to change your major and ask Alex to help you through it",
            nextNodeId: "ending-transformation",
            isPremium: true,
            diamondCost: 15
          },
          {
            id: "choice-gradual-change",
            text: "Take things slowly but commit to exploring your true passions",
            nextNodeId: "ending-growth",
            isPremium: false
          }
        ]
      },

      // Second Chance Path
      {
        id: "path-second-chance",
        title: "Running After Dreams",
        content: `Jake stared at his textbook for another thirty seconds before he couldn't take it anymore. Whatever was on the exam tomorrow couldn't be more important than this moment.

He shoved his books into his bag and practically ran toward the library exit. His heart pounded as he pushed through the doors and into the cool night air, scanning the walkways for any sign of Alex.

There – about fifty yards ahead, walking slowly toward the campus cafe, was the familiar figure he'd been hoping to see. Jake called out, his voice carrying across the quiet campus.

"Alex! Wait!"

Alex turned, surprise and something that might have been hope crossing their features as Jake jogged up to them, slightly out of breath.

"I... I was wondering if I could join you for that coffee after all," Jake said, trying to catch his breath. "I realized that some things are more important than economics textbooks."`,
        choices: [
          {
            id: "choice-second-chance-honest",
            text: "Be completely honest about why you changed your mind",
            nextNodeId: "ending-second-chance",
            isPremium: false
          },
          {
            id: "choice-second-chance-confident",
            text: "Act confident and suggest making it a date",
            nextNodeId: "path-confident-approach",
            isPremium: true,
            diamondCost: 7
          }
        ]
      },

      // ENDINGS
      {
        id: "ending-academic",
        title: "Academic Focus",
        content: `Jake buried himself in his studies for the rest of the night. When morning came, he was exhausted but prepared. He aced Professor Hartwell's exam and graduated with honors in economics.

Years later, working at a prestigious consulting firm, he would sometimes wonder about that night in the library. He'd built a successful career, but there was always a part of him that wondered what might have been if he'd been brave enough to take that chance with Alex.

He never saw Alex again after that night, but sometimes, walking through the city, he'd catch a glimpse of someone with similar hair, and his heart would skip a beat before reality set in.

**ENDING: The Path Not Taken**`,
        isEnding: true,
        endingType: "academic"
      },

      {
        id: "ending-romance",
        title: "Under the Stars",
        content: `The moment felt perfect – the quiet campus, the soft glow of the streetlight, the electricity between them that had been building all evening. Jake stepped closer to Alex, his heart racing.

"Can I...?" he started to ask, but Alex answered by closing the distance between them.

Their first kiss was soft and tentative, then deeper as they both realized this was exactly what they'd been hoping for. When they finally broke apart, both were smiling.

"I've been hoping you'd do that all evening," Alex whispered.

That kiss under the streetlight was the beginning of something beautiful. They spent the rest of college together, supporting each other through finals, celebrating successes, and building the kind of love that romance novels are written about.

**ENDING: Perfect Romance**`,
        isEnding: true,
        endingType: "romance"
      },

      {
        id: "ending-relationship",
        title: "New Beginnings",
        content: `"I'd really like that," Jake said, feeling more confident than he had all semester. "How about tomorrow afternoon? There's that little place off campus with the good pastries."

"It's a date," Alex said with a warm smile.

Their first official date led to many more. They discovered they shared not just intellectual compatibility but genuine affection and respect for each other. Their relationship grew steadily through the rest of college, built on a foundation of deep conversations, shared laughter, and mutual support.

What started as a chance encounter in a late-night library became a love story that would last well beyond graduation.

**ENDING: Love Story**`,
        isEnding: true,
        endingType: "relationship"
      },

      {
        id: "ending-friendship",
        title: "Meaningful Connection",
        content: `They found a cozy corner table in the cafe and talked until the sun began to rise. What Jake had thought might be romantic attraction evolved into something deeper – a genuine friendship based on intellectual curiosity and mutual respect.

Alex became Jake's closest friend at university. They studied together, challenged each other's ideas, and supported each other through the ups and downs of college life. While it never became romantic, their friendship enriched both their lives immeasurably.

Years later, they remained close friends, each having found love elsewhere but always grateful for the deep connection that began that night in the library.

**ENDING: Lasting Friendship**`,
        isEnding: true,
        endingType: "friendship"
      },

      {
        id: "ending-transformation",
        title: "Life Changed",
        content: `That conversation changed everything. With Alex's support and encouragement, Jake found the courage to switch his major to sustainable architecture. It wasn't easy – his parents were initially upset, and he had to take extra courses – but it felt right in a way that economics never had.

Alex was there through every step of the transformation, offering both emotional support and intellectual challenges that helped Jake grow. Their relationship deepened into something that was part romance, part intellectual partnership, and entirely life-changing.

Jake went on to design some of the most innovative eco-friendly buildings in the country, always crediting that late-night conversation in the library as the moment his real life began.

**ENDING: Transformation**`,
        isEnding: true,
        endingType: "transformation"
      },

      {
        id: "ending-growth",
        title: "Gradual Awakening",
        content: `Jake didn't change his major immediately, but that conversation planted a seed. He began taking elective courses in environmental studies and architecture, slowly exploring his true interests while finishing his economics degree.

His relationship with Alex grew steadily, providing him with the emotional support and intellectual stimulation he needed to gradually become more authentic to himself. By graduation, he had a clear plan to pursue graduate studies in sustainable design.

The change was gradual but profound, and Alex was there for every step of the journey, celebrating small victories and providing comfort during moments of doubt.

**ENDING: Personal Growth**`,
        isEnding: true,
        endingType: "growth"
      },

      {
        id: "ending-second-chance",
        title: "Courage Rewarded",
        content: `"I changed my mind because I realized I was being a coward," Jake said honestly. "I've been wanting to talk to you all semester, and when you walked away, I realized I might never get another chance like this."

Alex's smile was radiant. "I'm really glad you came after me. I was hoping you would."

They spent the next several hours in the cafe, talking about everything from philosophy to their dreams for the future. It was the beginning of a relationship built on honesty, courage, and the willingness to take chances.

Sometimes the best things in life require a leap of faith, and Jake was grateful he'd found the courage to jump.

**ENDING: Second Chances**`,
        isEnding: true,
        endingType: "second-chance"
      },

      {
        id: "path-confident-approach",
        title: "Bold Move",
        content: `"Actually," Jake said with newfound confidence, "I was thinking this could be more than just coffee. Would you like to consider it a date?"

Alex raised an eyebrow, clearly impressed by Jake's directness. "I like a person who knows what they want," they said with a smile. "Yes, I'd very much like it to be a date."

The confidence Jake felt in that moment carried over into everything else. He aced his exam the next day, not because he'd studied more, but because he'd learned something more important than economics: sometimes taking emotional risks makes you stronger in every area of life.

**ENDING: Confidence**`,
        isEnding: true,
        endingType: "confidence"
      }
    ]
  },
  {
    id: "midnight-coffee", 
    title: "Midnight Coffee",
    description: "Working late at the coffee shop, Sam never expected the regular customer to change everything.",
    spiceLevel: 1,
    category: "lgbt",
    nodes: [
      // Free story progression (5 pages)
      {
        id: "start",
        title: "After Hours",
        content: `The coffee shop felt different at night. During the day, Grind & Brew buzzed with students and business people, but after 11 PM, it transformed into something quieter, more intimate.

Sam had been working the closing shift for six months now and had grown to love these late hours. The soft jazz, the warm glow of pendant lights, the way the street looked through rain-streaked windows – it all felt more like a cozy living room than a commercial establishment.

The regular daytime crowd had been replaced by a smaller group of nighttime regulars. There was Marcus, the grad student; Elena, the nurse; and a handful of others who had become familiar faces in Sam's nocturnal world.

But tonight felt different. Maybe it was the rain that had been falling steadily since dinner time, creating a cocoon-like atmosphere that made the outside world seem distant and irrelevant.`
      },
      {
        id: "page-2", 
        title: "The Regular",
        content: `Sam glanced at the clock above the espresso machine: 11:47 PM. Just thirteen more minutes until closing, and then they could finally head home to their small apartment above the bookstore next door.

That's when the bell above the door chimed, and Sam looked up to see River walking in from the rain. River was one of the most reliable regulars – had been coming here for months, always ordering the same thing: a double espresso, no sugar, extra hot.

But tonight, River looked different. Their usual confident stride had been replaced by uncertain steps, and instead of their typical focused expression, there was something vulnerable in their demeanor.

River had always intrigued Sam. They clearly worked late hours, judging by their schedule, and always carried a leather portfolio that suggested some kind of creative work. But they never lingered, never made small talk beyond polite pleasantries.

Tonight, however, River approached the counter slowly, as if weighing each step.`
      },
      {
        id: "page-3",
        title: "Something Different",
        content: `"The usual?" Sam asked, already reaching for the espresso beans, but River shook their head.

"Actually," River said, their voice softer than usual, "could I get something... different tonight? Maybe something warm and comforting? I've had a long day."

Sam paused, studying River's face in the warm light. There were stress lines around their eyes that hadn't been there before, and their usually perfect composure seemed fragile.

"How about a lavender honey latte?" Sam suggested. "It's not on the menu, but it's my go-to when I need something soothing."

River's expression brightened slightly. "That sounds perfect, actually. You know, I've been coming here for months, and I don't think I've ever asked your name."

"Sam," they replied, already beginning to craft the drink with more care than usual. "And you're River, right? I've seen it on your credit card."

A small smile tugged at River's lips. "Observant. I like that."`
      },
      {
        id: "page-4",
        title: "Opening Up", 
        content: `As Sam worked on the latte, adding a delicate foam art design of a leaf, River settled onto one of the bar stools at the counter instead of taking their usual corner table.

"I'm a graphic designer," River said unexpectedly. "Freelance. Which explains the weird hours and the constant caffeine dependence."

Sam looked up from the espresso machine. "That explains the portfolio. Are you working on something interesting?"

River laughed, but there was a tired edge to it. "I just lost a major client today. Three months of work, and they decided to go with someone else's concept. I've been walking around the city in the rain for hours, trying to figure out what to do next."

The vulnerability in River's voice made Sam pause in their work. They'd seen hundreds of customers over the months, but something about this moment felt different, more genuine than the usual late-night interactions.

"I'm sorry," Sam said softly. "That sounds devastating."

"It is," River admitted. "But sitting here, talking to you... it's the first time today that I don't feel completely lost."`
      },
      {
        id: "page-5",
        title: "The Connection",
        content: `Sam finished the latte and slid it across the counter, their fingers briefly brushing River's as they accepted the cup. The touch was brief but electric, sending an unexpected warmth up Sam's arm.

"This is beautiful," River said, looking down at the foam art. "You're an artist too."

"Just a coffee shop employee with too much time to practice," Sam replied, but they felt pleased by the compliment.

River took a sip and closed their eyes. "This is exactly what I needed. How did you know?"

The clock above them showed 11:55 PM. In five minutes, Sam would need to start closing procedures, but for the first time in months, they didn't want their shift to end. There was something about River's presence, their openness, that made the normally solitary closing routine feel incomplete.

"Would you like to stay while I close up?" Sam asked impulsively. "I mean, if you don't have anywhere else to be. Sometimes it's nice to have company."`,
        choices: [
          {
            id: "choice-offer-help",
            text: "Offer to help River with their portfolio over coffee",
            nextNodeId: "creative-collaboration",
            isPremium: false
          },
          {
            id: "choice-suggest-walk", 
            text: "Suggest taking a walk together after closing",
            nextNodeId: "night-walk",
            isPremium: true,
            diamondCost: 5
          }
        ]
      },

      // Story paths and endings
      {
        id: "creative-collaboration",
        title: "Artistic Minds",
        content: `River's eyes lit up. "Actually, that would be amazing. I could use a fresh perspective, and something tells me you have a good eye for design."

As Sam went through the closing routine, River pulled out their portfolio and spread some designs across one of the tables. The work was stunning – clean lines, bold colors, and concepts that seemed to leap off the page.

"These are incredible," Sam said genuinely. "That client was an idiot to pass these up."

Working together, they refined River's presentations and brainstormed new approaches. Sam's coffee artistry translated into an intuitive understanding of visual composition, and their suggestions helped River see their work in a new light.

By 2 AM, they had restructured River's entire portfolio and developed a strategy for approaching new clients. More importantly, they'd discovered a creative chemistry that felt both natural and exciting.

**ENDING: Creative Partnership**`,
        isEnding: true,
        endingType: "collaboration"
      },

      {
        id: "night-walk",
        title: "Under the Stars",
        content: `"I'd love that," River said, their smile genuine and warm. "I've been walking aimlessly all evening, but walking with you sounds much better."

After Sam finished closing, they stepped out into the cool night air together. The rain had stopped, leaving the streets glistening under the streetlights. They walked slowly, talking about everything and nothing – River's design work, Sam's dreams of opening their own coffee shop, the way the city felt different at night.

When they reached the small park near Sam's apartment, River stopped walking and turned to face them.

"Thank you," River said softly. "For the coffee, for listening, for... this. I came in tonight feeling like my world was falling apart, and somehow you've made everything feel possible again."

The space between them seemed to shrink, and Sam felt their heart racing as River stepped closer.

**ENDING: New Beginning**`,
        isEnding: true,
        endingType: "romance"
      }
    ]
  }
];