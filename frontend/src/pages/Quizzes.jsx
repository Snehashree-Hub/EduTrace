import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  RotateCcw,
  Target,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import "./quizzes.css";

const RESULT_KEY = "edutrace_quiz_results";

const EXAM_DATA = {
  "Government Exams": {
    exams: ["TNPSC", "UPSC", "SSC", "Banking", "Railway"],
    subjects: {
      TNPSC: [
        "General Studies",
        "General Tamil",
        "General English",
        "Aptitude & Mental Ability",
      ],
      UPSC: ["General Studies", "Indian Polity", "History", "Geography"],
      SSC: ["General Awareness", "Quantitative Aptitude", "Reasoning", "English"],
      Banking: ["Quantitative Aptitude", "Reasoning", "English", "General Awareness"],
      Railway: ["General Science", "Mathematics", "Reasoning", "General Awareness"],
    },
  },

  "Entrance Exams": {
    exams: ["JEE Main", "JEE Advanced", "NEET", "CUET"],
    subjects: {
      "JEE Main": ["Physics", "Chemistry", "Mathematics"],
      "JEE Advanced": ["Physics", "Chemistry", "Mathematics"],
      NEET: ["Physics", "Chemistry", "Biology"],
      CUET: ["General Test", "English", "Mathematics"],
    },
  },

  "School Exams": {
    exams: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"],
    subjects: {
      "Class 6": ["Mathematics", "Science", "English", "Social Science"],
      "Class 7": ["Mathematics", "Science", "English", "Social Science"],
      "Class 8": ["Mathematics", "Science", "English", "Social Science"],
      "Class 9": ["Mathematics", "Science", "English", "Social Science"],
      "Class 10": ["Mathematics", "Science", "English", "Social Science"],
      "Class 11": ["Physics", "Chemistry", "Mathematics", "Biology"],
      "Class 12": ["Physics", "Chemistry", "Mathematics", "Biology"],
    },
  },

  "College Exams": {
    exams: ["Semester Exam", "Internal Exam", "End Semester", "University Exam"],
    subjects: {
      "Semester Exam": [
        "Computer Science",
        "Mathematics",
        "Artificial Intelligence",
        "Data Science",
      ],
      "Internal Exam": [
        "Computer Science",
        "Mathematics",
        "Artificial Intelligence",
        "Data Science",
      ],
      "End Semester": [
        "Computer Science",
        "Artificial Intelligence",
        "Machine Learning",
        "Data Science",
      ],
      "University Exam": [
        "Computer Science",
        "Mathematics",
        "Artificial Intelligence",
        "Machine Learning",
      ],
    },
  },

  "Competitive Exams": {
    exams: ["CAT", "GATE", "CLAT", "GRE", "GMAT"],
    subjects: {
      CAT: ["Quantitative Aptitude", "Logical Reasoning", "Verbal Ability"],
      GATE: ["Computer Science", "Mathematics", "Data Structures"],
      CLAT: ["Legal Reasoning", "English", "Logical Reasoning", "General Knowledge"],
      GRE: ["Quantitative Reasoning", "Verbal Reasoning"],
      GMAT: ["Quantitative Reasoning", "Verbal Reasoning", "Data Interpretation"],
    },
  },

  "Skill / Career Learning": {
    exams: [
      "Python",
      "Data Science",
      "Machine Learning",
      "Artificial Intelligence",
      "Web Development",
      "Automation",
    ],
    subjects: {
      Python: ["Python Basics", "Python Programming", "Problem Solving"],
      "Data Science": ["Data Analysis", "Statistics", "Python"],
      "Machine Learning": ["ML Fundamentals", "Supervised Learning", "Model Evaluation"],
      "Artificial Intelligence": ["AI Fundamentals", "Search", "Knowledge Representation"],
      "Web Development": ["HTML", "CSS", "JavaScript"],
      Automation: ["Automation Fundamentals", "Selenium", "Python Automation"],
    },
  },
};

const QUESTION_BANKS = {
  "General Studies": [
    ["Which part of the Indian Constitution deals with Fundamental Rights?", ["Part I", "Part II", "Part III", "Part IV"], 2],
    ["Who is known as the chief architect of the Indian Constitution?", ["Mahatma Gandhi", "B. R. Ambedkar", "Jawaharlal Nehru", "Sardar Patel"], 1],
    ["What is the capital of India?", ["Mumbai", "New Delhi", "Kolkata", "Chennai"], 1],
    ["Which is the largest state in India by area?", ["Maharashtra", "Madhya Pradesh", "Rajasthan", "Uttar Pradesh"], 2],
    ["Which body conducts elections in India?", ["Supreme Court", "Election Commission of India", "Parliament", "Finance Commission"], 1],
    ["The Indian Parliament consists of Lok Sabha, Rajya Sabha and:", ["President", "Prime Minister", "Chief Justice", "Governor"], 0],
    ["Which is the highest court in India?", ["High Court", "District Court", "Supreme Court", "Sessions Court"], 2],
    ["Which fundamental duty relates to protecting the environment?", ["Duty to vote", "Duty to protect environment", "Duty to pay tax", "Duty to join army"], 1],
    ["Which ocean lies to the south of India?", ["Atlantic Ocean", "Pacific Ocean", "Indian Ocean", "Arctic Ocean"], 2],
    ["Which is the longest river in India?", ["Ganga", "Yamuna", "Godavari", "Narmada"], 0],
    ["Green Revolution is mainly associated with:", ["Milk production", "Food grain production", "Fish production", "Oil production"], 1],
    ["Which institution is responsible for monetary policy in India?", ["SEBI", "RBI", "NITI Aayog", "NABARD"], 1],
    ["The currency of Japan is:", ["Won", "Yuan", "Yen", "Ringgit"], 2],
    ["Who appoints the Prime Minister of India?", ["Chief Justice", "President", "Speaker", "Governor"], 1],
    ["Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Mercury"], 1],
    ["Which gas is most abundant in Earth's atmosphere?", ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], 1],
    ["World Environment Day is observed on:", ["June 5", "July 5", "May 1", "April 22"], 0],
    ["Which movement was launched by Mahatma Gandhi in 1942?", ["Non-Cooperation", "Quit India", "Civil Disobedience", "Swadeshi"], 1],
    ["The Constitution of India came into effect on:", ["15 August 1947", "26 January 1950", "26 November 1949", "2 October 1950"], 1],
    ["Which is the smallest Union Territory by area?", ["Lakshadweep", "Delhi", "Puducherry", "Chandigarh"], 0],
    ["Which Indian state has the longest coastline?", ["Tamil Nadu", "Gujarat", "Kerala", "Odisha"], 1],
    ["Who was the first President of India?", ["Rajendra Prasad", "S. Radhakrishnan", "Zakir Husain", "V. V. Giri"], 0],
    ["Which tax is a major indirect tax in India?", ["Income Tax", "GST", "Property Tax", "Corporate Tax"], 1],
    ["The Himalayas are an example of:", ["Block mountains", "Fold mountains", "Volcanic mountains", "Residual mountains"], 1],
    ["Which organ purifies blood in the human body?", ["Heart", "Liver", "Kidney", "Lung"], 2],
    ["Which is the largest planet in the Solar System?", ["Earth", "Saturn", "Jupiter", "Neptune"], 2],
    ["The study of earthquakes is called:", ["Ecology", "Seismology", "Meteorology", "Geology"], 1],
    ["Which metal is liquid at room temperature?", ["Iron", "Mercury", "Copper", "Aluminium"], 1],
    ["Who wrote the national anthem of India?", ["Rabindranath Tagore", "Bankim Chandra", "Subramania Bharati", "Sarojini Naidu"], 0],
    ["Which is the lower house of Parliament?", ["Rajya Sabha", "Lok Sabha", "Vidhan Sabha", "Legislative Council"], 1],
  ],

  "Indian Polity": [
    ["How many Fundamental Rights are currently guaranteed by the Indian Constitution?", ["5", "6", "7", "8"], 1],
    ["The President of India is elected for a term of:", ["4 years", "5 years", "6 years", "7 years"], 1],
    ["Who is the constitutional head of a state?", ["Chief Minister", "Governor", "Speaker", "Chief Secretary"], 1],
    ["Which house is also called the Council of States?", ["Lok Sabha", "Rajya Sabha", "Vidhan Sabha", "Legislative Assembly"], 1],
    ["The Directive Principles are contained in which Part?", ["Part II", "Part III", "Part IV", "Part V"], 2],
    ["The Supreme Court is established under:", ["Article 124", "Article 32", "Article 14", "Article 21"], 0],
    ["Article 14 deals with:", ["Freedom of speech", "Equality before law", "Right to education", "Freedom of religion"], 1],
    ["Article 21 protects:", ["Right to property", "Right to life and personal liberty", "Right to vote", "Right to work"], 1],
    ["The Parliament of India is:", ["Unicameral", "Bicameral", "Tricameral", "Federal only"], 1],
    ["The minimum age to become President of India is:", ["25", "30", "35", "40"], 2],
    ["The minimum age for Lok Sabha membership is:", ["18", "21", "25", "30"], 2],
    ["The minimum age for Rajya Sabha membership is:", ["21", "25", "30", "35"], 2],
    ["Who presides over the Lok Sabha?", ["President", "Speaker", "Prime Minister", "Vice President"], 1],
    ["Who is the ex-officio Chairman of Rajya Sabha?", ["President", "Prime Minister", "Vice President", "Speaker"], 2],
    ["The Indian Constitution was adopted on:", ["15 August 1947", "26 November 1949", "26 January 1950", "2 October 1948"], 1],
    ["Which amendment lowered the voting age from 21 to 18?", ["42nd", "44th", "61st", "73rd"], 2],
    ["Panchayati Raj institutions received constitutional status through:", ["61st Amendment", "73rd Amendment", "74th Amendment", "86th Amendment"], 1],
    ["Municipalities received constitutional status through:", ["73rd Amendment", "74th Amendment", "42nd Amendment", "44th Amendment"], 1],
    ["Who is the guardian of the Constitution?", ["Parliament", "Supreme Court", "President", "Prime Minister"], 1],
    ["Which article is associated with constitutional remedies?", ["14", "19", "21", "32"], 3],
    ["The Finance Commission is constituted under:", ["Article 280", "Article 324", "Article 356", "Article 368"], 0],
    ["The Election Commission is provided under:", ["Article 280", "Article 324", "Article 370", "Article 123"], 1],
    ["A Money Bill can be introduced only in:", ["Rajya Sabha", "Lok Sabha", "Either House", "Supreme Court"], 1],
    ["Who certifies a Money Bill?", ["President", "Prime Minister", "Lok Sabha Speaker", "Finance Minister"], 2],
    ["Fundamental Duties were added by which amendment?", ["42nd", "44th", "52nd", "61st"], 0],
    ["The constitutional amendment procedure is mainly under:", ["Article 352", "Article 356", "Article 368", "Article 370"], 2],
    ["The Vice President is elected by:", ["People directly", "Members of Parliament", "State Assemblies only", "Supreme Court"], 1],
    ["The Council of Ministers is headed by:", ["President", "Prime Minister", "Speaker", "Vice President"], 1],
    ["The Governor is appointed by:", ["Prime Minister", "President", "Chief Minister", "Chief Justice"], 1],
    ["Which body audits government accounts?", ["RBI", "CAG", "SEBI", "NITI Aayog"], 1],
  ],

  "Mathematics": [
    ["What is 15% of 200?", ["20", "25", "30", "35"], 2],
    ["If x + 5 = 12, x equals:", ["5", "6", "7", "8"], 2],
    ["What is the square of 12?", ["124", "144", "154", "164"], 1],
    ["The value of 3 × 4 + 5 is:", ["17", "27", "32", "20"], 0],
    ["A triangle has angles 60°, 60° and:", ["30°", "45°", "60°", "90°"], 2],
    ["The perimeter of a square with side 5 cm is:", ["10 cm", "15 cm", "20 cm", "25 cm"], 2],
    ["The area of a rectangle 8 cm × 5 cm is:", ["13 cm²", "26 cm²", "40 cm²", "80 cm²"], 2],
    ["What is 2/5 as a percentage?", ["20%", "30%", "40%", "50%"], 2],
    ["The HCF of 12 and 18 is:", ["2", "3", "6", "9"], 2],
    ["The LCM of 4 and 6 is:", ["8", "10", "12", "24"], 2],
    ["What is 7²?", ["14", "21", "49", "56"], 2],
    ["If a = 4, then 2a + 3 equals:", ["8", "9", "11", "12"], 2],
    ["A ratio of 2:3 has total 25. The first part is:", ["8", "10", "12", "15"], 1],
    ["Simple interest on ₹1000 at 10% for 2 years is:", ["₹100", "₹150", "₹200", "₹250"], 2],
    ["The average of 10, 20 and 30 is:", ["15", "20", "25", "30"], 1],
    ["What is √81?", ["7", "8", "9", "10"], 2],
    ["1 kilometre equals:", ["100 m", "500 m", "1000 m", "1500 m"], 2],
    ["A right angle measures:", ["45°", "60°", "90°", "180°"], 2],
    ["What is 25 × 4?", ["50", "75", "100", "125"], 2],
    ["If 5 pens cost ₹50, one pen costs:", ["₹5", "₹10", "₹15", "₹20"], 1],
    ["The next prime number after 11 is:", ["12", "13", "14", "15"], 1],
    ["What is 3/4 of 100?", ["25", "50", "75", "80"], 2],
    ["The sum of angles in a triangle is:", ["90°", "180°", "270°", "360°"], 1],
    ["What is 0.5 as a fraction?", ["1/2", "1/3", "2/3", "3/4"], 0],
    ["A circle's diameter is twice its:", ["Area", "Radius", "Circumference", "Chord"], 1],
    ["What is 10³?", ["100", "1000", "10000", "30"], 1],
    ["If 20% of a number is 40, the number is:", ["100", "150", "200", "250"], 2],
    ["What is 9 × 9?", ["72", "81", "90", "99"], 1],
    ["The probability of getting heads from a fair coin is:", ["0", "1/4", "1/2", "1"], 2],
    ["A straight angle measures:", ["90°", "180°", "270°", "360°"], 1],
  ],

  "Physics": [
    ["SI unit of force is:", ["Joule", "Newton", "Watt", "Pascal"], 1],
    ["Speed is defined as:", ["Distance/time", "Time/distance", "Mass/volume", "Force/area"], 0],
    ["SI unit of energy is:", ["Newton", "Joule", "Watt", "Volt"], 1],
    ["Acceleration is the rate of change of:", ["Distance", "Velocity", "Mass", "Energy"], 1],
    ["Which instrument measures electric current?", ["Voltmeter", "Ammeter", "Barometer", "Thermometer"], 1],
    ["Unit of electric current is:", ["Volt", "Ohm", "Ampere", "Watt"], 2],
    ["Which law relates force, mass and acceleration?", ["Newton's First Law", "Newton's Second Law", "Newton's Third Law", "Ohm's Law"], 1],
    ["The SI unit of power is:", ["Joule", "Watt", "Newton", "Pascal"], 1],
    ["Light travels fastest in:", ["Water", "Glass", "Vacuum", "Air"], 2],
    ["Which lens is commonly used to correct myopia?", ["Convex", "Concave", "Cylindrical", "Plane"], 1],
    ["Sound cannot travel through:", ["Air", "Water", "Steel", "Vacuum"], 3],
    ["The unit of frequency is:", ["Hertz", "Joule", "Newton", "Tesla"], 0],
    ["Heat transfer through direct contact is:", ["Radiation", "Convection", "Conduction", "Reflection"], 2],
    ["Which quantity is measured in kilograms?", ["Force", "Mass", "Energy", "Power"], 1],
    ["Gravitational acceleration near Earth's surface is approximately:", ["9.8 m/s²", "5 m/s²", "15 m/s²", "20 m/s²"], 0],
    ["Ohm's law is:", ["V = IR", "P = VI", "F = ma", "E = mc²"], 0],
    ["A device that converts electrical energy into mechanical energy is:", ["Generator", "Motor", "Transformer", "Battery"], 1],
    ["Which phenomenon explains rainbow formation?", ["Diffraction only", "Dispersion", "Magnetism", "Conduction"], 1],
    ["The energy possessed due to motion is:", ["Potential energy", "Kinetic energy", "Chemical energy", "Nuclear energy"], 1],
    ["Potential energy depends on:", ["Position", "Colour", "Temperature only", "Sound"], 0],
    ["Which is a scalar quantity?", ["Velocity", "Force", "Speed", "Displacement"], 2],
    ["Which is a vector quantity?", ["Mass", "Time", "Temperature", "Velocity"], 3],
    ["The unit of resistance is:", ["Ohm", "Volt", "Ampere", "Watt"], 0],
    ["A transformer works mainly with:", ["AC", "DC only", "Static charge", "Chemical energy"], 0],
    ["Which particle has negative charge?", ["Proton", "Neutron", "Electron", "Photon"], 2],
    ["The speed of light in vacuum is approximately:", ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10⁴ m/s", "3 × 10² m/s"], 0],
    ["Which force keeps planets in orbit?", ["Friction", "Gravity", "Magnetic force", "Nuclear force"], 1],
    ["A fuse is used for:", ["Increasing voltage", "Protecting circuits", "Storing energy", "Measuring current"], 1],
    ["Which mirror is used in vehicle rear-view mirrors?", ["Plane", "Concave", "Convex", "Parabolic"], 2],
    ["Density equals:", ["Mass × volume", "Mass / volume", "Volume / mass", "Force / area"], 1],
  ],

  "Chemistry": [
    ["The smallest unit of an element that retains its chemical properties is:", ["Molecule", "Atom", "Cell", "Compound"], 1],
    ["The chemical symbol for sodium is:", ["So", "S", "Na", "N"], 2],
    ["Water has the chemical formula:", ["CO₂", "H₂O", "O₂", "H₂"], 1],
    ["A substance with pH less than 7 is generally:", ["Basic", "Acidic", "Neutral", "Metallic"], 1],
    ["Which gas is released during photosynthesis?", ["Oxygen", "Nitrogen", "Hydrogen", "Methane"], 0],
    ["The atomic number represents the number of:", ["Neutrons", "Protons", "Shells", "Molecules"], 1],
    ["NaCl is commonly known as:", ["Baking soda", "Common salt", "Bleaching powder", "Vinegar"], 1],
    ["Which is a noble gas?", ["Oxygen", "Nitrogen", "Helium", "Hydrogen"], 2],
    ["Rusting of iron requires oxygen and:", ["Carbon", "Water/moisture", "Nitrogen", "Helium"], 1],
    ["The gas commonly used in balloons is:", ["Helium", "Oxygen", "Carbon dioxide", "Chlorine"], 0],
    ["HCl is:", ["Hydrochloric acid", "Sulfuric acid", "Nitric acid", "Acetic acid"], 0],
    ["The chemical formula of carbon dioxide is:", ["CO", "CO₂", "C₂O", "C₂O₂"], 1],
    ["Which metal is highly reactive with water?", ["Gold", "Sodium", "Copper", "Silver"], 1],
    ["The process of converting a solid directly into gas is:", ["Condensation", "Sublimation", "Freezing", "Melting"], 1],
    ["Which is a physical change?", ["Burning paper", "Rusting", "Melting ice", "Cooking food"], 2],
    ["A neutral solution generally has pH:", ["0", "5", "7", "14"], 2],
    ["Which element is essential for breathing?", ["Oxygen", "Sodium", "Iron", "Gold"], 0],
    ["The periodic table is arranged primarily by:", ["Atomic number", "Colour", "Density", "Melting point"], 0],
    ["Which is an example of a mixture?", ["Oxygen", "Gold", "Air", "Sodium chloride"], 2],
    ["The change from liquid to gas is called:", ["Evaporation", "Freezing", "Condensation", "Deposition"], 0],
    ["Which acid is present in vinegar?", ["Citric acid", "Acetic acid", "Hydrochloric acid", "Sulfuric acid"], 1],
    ["Which gas is required for combustion?", ["Oxygen", "Nitrogen", "Helium", "Carbon dioxide"], 0],
    ["An element's chemical properties depend strongly on its:", ["Atomic structure", "Colour", "Shape", "Size only"], 0],
    ["Which substance is a base?", ["HCl", "NaOH", "CO₂", "H₂SO₄"], 1],
    ["The process in which an acid reacts with a base is:", ["Neutralization", "Sublimation", "Oxidation only", "Distillation"], 0],
    ["Which particle has no electric charge?", ["Electron", "Proton", "Neutron", "Ion"], 2],
    ["Oxygen has the chemical symbol:", ["Ox", "O", "Og", "Oy"], 1],
    ["Which is a greenhouse gas?", ["Carbon dioxide", "Oxygen", "Nitrogen", "Helium"], 0],
    ["The study of carbon compounds is called:", ["Organic chemistry", "Inorganic chemistry", "Physical geography", "Astronomy"], 0],
    ["Which process separates a liquid mixture based on boiling points?", ["Filtration", "Distillation", "Decantation", "Sieving"], 1],
  ],

  "Biology": [
    ["The basic unit of life is:", ["Tissue", "Cell", "Organ", "Atom"], 1],
    ["Which organ pumps blood through the body?", ["Lung", "Heart", "Kidney", "Liver"], 1],
    ["Photosynthesis mainly occurs in:", ["Mitochondria", "Chloroplasts", "Nucleus", "Ribosomes"], 1],
    ["Which gas do plants absorb during photosynthesis?", ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], 1],
    ["DNA stands for:", ["Deoxyribonucleic Acid", "Dynamic Nuclear Acid", "Double Nitrogen Acid", "Deoxygenated Nucleic Acid"], 0],
    ["The powerhouse of the cell is:", ["Nucleus", "Mitochondria", "Golgi body", "Cell wall"], 1],
    ["Which blood cells help fight infections?", ["Red blood cells", "White blood cells", "Platelets", "Plasma"], 1],
    ["Which blood component helps clotting?", ["Platelets", "RBC", "WBC", "Plasma"], 0],
    ["The human respiratory organ is:", ["Heart", "Lung", "Kidney", "Stomach"], 1],
    ["Which organ filters blood and produces urine?", ["Liver", "Kidney", "Lung", "Heart"], 1],
    ["Plants lose water mainly through:", ["Roots", "Stomata", "Seeds", "Flowers"], 1],
    ["The green pigment in plants is:", ["Hemoglobin", "Chlorophyll", "Melanin", "Keratin"], 1],
    ["Which vitamin is produced in skin with sunlight exposure?", ["Vitamin A", "Vitamin B12", "Vitamin C", "Vitamin D"], 3],
    ["The human skeleton mainly provides:", ["Support and protection", "Digestion", "Respiration", "Blood filtration"], 0],
    ["Which part of the brain controls many voluntary movements?", ["Cerebrum", "Medulla", "Spinal fluid", "Retina"], 0],
    ["The functional unit of kidney is:", ["Neuron", "Nephron", "Alveolus", "Villus"], 1],
    ["Which organ helps in digestion by producing bile?", ["Liver", "Heart", "Lung", "Brain"], 0],
    ["The genetic material in most living organisms is:", ["DNA", "Starch", "Fat", "Cellulose"], 0],
    ["Which is a plant tissue that transports water?", ["Phloem", "Xylem", "Epidermis", "Cortex"], 1],
    ["Which tissue transports food in plants?", ["Xylem", "Phloem", "Meristem", "Epidermis"], 1],
    ["The process by which cells divide to produce two similar daughter cells is:", ["Mitosis", "Meiosis", "Fusion", "Pollination"], 0],
    ["Which structure controls many cell activities?", ["Nucleus", "Cell wall", "Vacuole", "Cytoplasm"], 0],
    ["A group of similar cells performing a function is called:", ["Tissue", "Organ", "System", "Organism"], 0],
    ["Which is an example of a vertebrate?", ["Earthworm", "Cockroach", "Fish", "Jellyfish"], 2],
    ["Which blood group is commonly called the universal donor for red-cell transfusion?", ["AB+", "O−", "A+", "B+"], 1],
    ["Which organ is mainly responsible for absorbing nutrients from food?", ["Small intestine", "Large intestine", "Stomach", "Esophagus"], 0],
    ["Which part of the eye controls the amount of light entering?", ["Retina", "Iris", "Lens", "Cornea"], 1],
    ["Which hormone helps regulate blood glucose?", ["Insulin", "Adrenaline", "Thyroxine", "Estrogen"], 0],
    ["The process of conversion of food into usable energy in cells is associated with:", ["Cellular respiration", "Photosynthesis", "Transpiration", "Pollination"], 0],
    ["Which organism is a microorganism?", ["Bacteria", "Elephant", "Mango tree", "Eagle"], 0],
  ],

  "Computer Science": [
    ["CPU stands for:", ["Central Processing Unit", "Computer Personal Unit", "Central Program Utility", "Control Processing User"], 0],
    ["Which memory is volatile?", ["ROM", "RAM", "SSD", "Hard disk"], 1],
    ["Which is an operating system?", ["Python", "Windows", "HTML", "SQL"], 1],
    ["Binary number system uses:", ["0 and 1", "1 and 2", "0 to 9", "A and B"], 0],
    ["Which device is used to input text?", ["Monitor", "Keyboard", "Speaker", "Projector"], 1],
    ["Which device displays visual output?", ["Keyboard", "Monitor", "Mouse", "Microphone"], 1],
    ["URL stands for:", ["Uniform Resource Locator", "Universal Record Link", "User Resource Language", "Uniform Read Line"], 0],
    ["Which protocol is commonly used for secure web browsing?", ["HTTP", "HTTPS", "FTP", "SMTP"], 1],
    ["Which language is commonly used to query relational databases?", ["HTML", "SQL", "CSS", "XML"], 1],
    ["A database table consists of rows and:", ["Slides", "Columns", "Pages", "Folders"], 1],
    ["Which data structure follows LIFO?", ["Queue", "Stack", "Tree", "Graph"], 1],
    ["Which data structure follows FIFO?", ["Stack", "Queue", "Tree", "Heap"], 1],
    ["What does RAM store?", ["Temporary working data", "Only permanent firmware", "Printed documents", "Internet cables"], 0],
    ["Which is a programming language?", ["Python", "HTML", "JPEG", "HTTP"], 0],
    ["Which symbol is commonly used for comments in Python?", ["//", "#", "<!--", "/*"], 1],
    ["An algorithm is:", ["A step-by-step procedure", "A hardware device", "A database", "An operating system"], 0],
    ["Which component performs arithmetic and logical operations?", ["ALU", "Monitor", "Keyboard", "SSD"], 0],
    ["What is debugging?", ["Finding and fixing errors", "Deleting files", "Installing RAM", "Designing hardware"], 0],
    ["Which is an example of cloud storage?", ["Google Drive", "Keyboard", "CPU", "RAM"], 0],
    ["HTML is mainly used to:", ["Structure web pages", "Train neural networks", "Manage electricity", "Compress images"], 0],
    ["CSS is mainly used for:", ["Web page styling", "Database queries", "Operating systems", "Encryption only"], 0],
    ["JavaScript is commonly used to:", ["Add interactivity to web pages", "Replace hardware", "Format hard disks", "Create electricity"], 0],
    ["Which is a version control system?", ["Git", "Chrome", "Linux", "Excel"], 0],
    ["What does API stand for?", ["Application Programming Interface", "Applied Program Internet", "Application Process Input", "Advanced Program Instruction"], 0],
    ["Which is a relational database?", ["MySQL", "Redis", "MongoDB", "Cassandra"], 0],
    ["A primary key should uniquely identify a:", ["Record", "Database server", "Screen", "Program"], 0],
    ["Which technology is used for containerization?", ["Docker", "Excel", "Photoshop", "PowerPoint"], 0],
    ["What is an IP address used for?", ["Identifying a device/interface on a network", "Charging a battery", "Formatting text", "Printing only"], 0],
    ["Which is an example of an input device?", ["Mouse", "Monitor", "Speaker", "Printer"], 0],
    ["Which operation searches efficiently in a sorted array?", ["Binary search", "Random typing", "Manual scan only", "Formatting"], 0],
  ],

  "Python Basics": [
    ["Which keyword defines a function in Python?", ["func", "define", "def", "function"], 2],
    ["Which symbol starts a comment in Python?", ["//", "#", "/*", "--"], 1],
    ["Which data type stores True or False?", ["int", "str", "bool", "list"], 2],
    ["Which function displays output?", ["input()", "print()", "show()", "displayText()"], 1],
    ["Which function receives input from the user?", ["read()", "input()", "scan()", "get()"], 1],
    ["What is the result of 5 + 3?", ["6", "7", "8", "9"], 2],
    ["Which is a valid Python list?", ["{1,2,3}", "[1,2,3]", "(1:2:3)", "<1,2,3>"], 1],
    ["Which symbol is used for exponentiation in Python?", ["^", "**", "//", "%%"], 1],
    ["What does len() return?", ["Length", "Type", "Memory address", "File path"], 0],
    ["Which keyword is used for a condition?", ["if", "when", "condition", "check"], 0],
    ["Which loop is commonly used to iterate over a sequence?", ["for", "repeat", "iterate", "loop"], 0],
    ["Which keyword exits a loop immediately?", ["stop", "exit", "break", "returnall"], 2],
    ["Which keyword skips to the next loop iteration?", ["skip", "continue", "next", "passloop"], 1],
    ["Which collection stores key-value pairs?", ["List", "Tuple", "Dictionary", "Set"], 2],
    ["Which brackets define a dictionary literal?", ["[]", "()", "{}", "<>"], 2],
    ["Strings in Python are commonly written inside:", ["Quotes", "Square brackets only", "Curly brackets only", "Slashes"], 0],
    ["What is the type of 10?", ["str", "float", "int", "bool"], 2],
    ["What is the type of 3.14?", ["int", "float", "str", "bool"], 1],
    ["Which operator checks equality?", ["=", "==", "!=", "=>"], 1],
    ["Which operator means not equal?", ["<>", "!=", "==", "not="], 1],
    ["What does append() do to a list?", ["Adds an item", "Deletes all items", "Sorts only", "Copies a file"], 0],
    ["Which keyword creates a class?", ["object", "class", "struct", "typeclass"], 1],
    ["Which statement handles exceptions?", ["try-except", "if-else only", "loop-case", "catch-only"], 0],
    ["What does import do?", ["Loads a module", "Deletes a module", "Runs hardware", "Creates a database"], 0],
    ["Which library is commonly used for numerical arrays?", ["NumPy", "HTML", "Flask only", "Git"], 0],
    ["Which library is commonly used for data analysis?", ["pandas", "pytest", "tkinter only", "socket"], 0],
    ["What does PEP stand for in Python context?", ["Python Enhancement Proposal", "Python Execution Program", "Programming Extension Package", "Python Environment Protocol"], 0],
    ["Which value represents absence of a value in Python?", ["null", "None", "empty", "void"], 1],
    ["Which method converts a string to lowercase?", ["lower()", "small()", "down()", "caseLower()"], 0],
    ["Which keyword returns a value from a function?", ["give", "send", "return", "output"], 2],
  ],

  "Machine Learning": [
    ["Which is an example of supervised learning?", ["Classification with labeled data", "Clustering without labels", "Random search", "Compression"], 0],
    ["Which is an unsupervised learning task?", ["Classification", "Regression", "Clustering", "Prediction with labels"], 2],
    ["What is a feature?", ["An input variable", "Only the final prediction", "A database server", "A chart"], 0],
    ["What is a label in supervised learning?", ["Target output", "Input feature only", "File name", "Model size"], 0],
    ["What does overfitting mean?", ["Model memorizes training data too closely", "Model has no data", "Model runs too fast", "Model uses no features"], 0],
    ["Which split is commonly used to evaluate generalization?", ["Training/test split", "Only training", "Only labels", "Only features"], 0],
    ["Accuracy is commonly used for:", ["Classification", "Image storage", "Database indexing only", "File compression"], 0],
    ["Precision is related to:", ["Correct positive predictions among predicted positives", "Total rows only", "Training time", "Number of features"], 0],
    ["Recall is related to:", ["Correct positives found among actual positives", "Model size", "CPU speed", "Number of classes only"], 0],
    ["Which algorithm is commonly used for classification?", ["Logistic Regression", "K-Means only", "PCA only", "Apriori only"], 0],
    ["Which algorithm is primarily a clustering algorithm?", ["K-Means", "Linear Regression", "Logistic Regression", "Naive Bayes"], 0],
    ["Linear regression predicts a:", ["Continuous value", "Class label only", "Cluster ID only", "Text document only"], 0],
    ["A decision tree can be used for:", ["Classification and regression", "Only sorting", "Only clustering", "Only compression"], 0],
    ["What is a training set?", ["Data used to fit a model", "Only final output", "Only metadata", "Test report"], 0],
    ["What is a test set?", ["Data used to evaluate the trained model", "Data used to create labels only", "Model code", "Feature names"], 0],
    ["What does normalization commonly do?", ["Rescales numeric features", "Deletes labels", "Adds rows", "Removes models"], 0],
    ["What is an epoch?", ["One complete pass through training data", "One feature", "One prediction", "One database"], 0],
    ["Gradient descent is used for:", ["Optimization", "Data storage", "File transfer", "Visualization only"], 0],
    ["A hyperparameter is:", ["A setting chosen before/during training", "Always a target label", "A test record", "A database field"], 0],
    ["Cross-validation helps estimate:", ["Model generalization", "File size", "Keyboard speed", "Screen resolution"], 0],
    ["What is dimensionality reduction?", ["Reducing number of features", "Adding labels", "Increasing rows", "Increasing noise"], 0],
    ["PCA is commonly used for:", ["Dimensionality reduction", "Classification only", "Database joins", "Web hosting"], 0],
    ["What is a confusion matrix used for?", ["Classification evaluation", "Image compression", "Data entry", "Cloud deployment"], 0],
    ["F1 score combines:", ["Precision and recall", "Accuracy and speed", "Loss and epochs", "Features and labels"], 0],
    ["A model with high variance may:", ["Overfit", "Always underfit", "Have no parameters", "Have no training data"], 0],
    ["A model with high bias may:", ["Underfit", "Always overfit", "Need no data", "Have infinite accuracy"], 0],
    ["What is feature engineering?", ["Creating or transforming useful input features", "Deleting all features", "Changing CPU", "Building hardware"], 0],
    ["What is inference?", ["Using a trained model to make predictions", "Training from scratch", "Deleting the model", "Collecting electricity"], 0],
    ["Why keep a test set separate?", ["To estimate performance on unseen data", "To increase training labels", "To change features", "To remove all errors"], 0],
    ["RAG stands for:", ["Retrieval-Augmented Generation", "Random AI Generator", "Regression Assisted Graph", "Rapid Algorithm Generator"], 0],
  ],

  "Artificial Intelligence": [
    ["AI stands for:", ["Artificial Intelligence", "Automated Internet", "Advanced Information", "Applied Interface"], 0],
    ["Machine learning is a subset of:", ["Artificial Intelligence", "HTML", "Networking", "Operating systems"], 0],
    ["NLP deals primarily with:", ["Human language", "Electric circuits", "Databases only", "Graphics hardware"], 0],
    ["Computer vision deals primarily with:", ["Images and visual data", "Sound only", "Databases only", "Text formatting"], 0],
    ["A chatbot is an example of:", ["Conversational AI", "Operating system", "Database", "Compiler"], 0],
    ["What is a neural network inspired by?", ["Biological neurons", "Hard disks", "Web browsers", "Printers"], 0],
    ["Deep learning commonly uses:", ["Multi-layer neural networks", "Only SQL", "Only HTML", "Only spreadsheets"], 0],
    ["Generative AI can:", ["Generate new content", "Only sort files", "Only calculate percentages", "Only store passwords"], 0],
    ["What is a prompt?", ["Instruction given to an AI model", "A hardware cable", "A database table", "A file extension"], 0],
    ["What is an AI model?", ["A learned computational system", "Only a chart", "A keyboard", "A web page"], 0],
    ["Training means:", ["Learning patterns from data", "Deleting data", "Formatting a drive", "Opening a browser"], 0],
    ["Inference means:", ["Using a trained model to produce an output", "Training hardware", "Deleting labels", "Writing CSS"], 0],
    ["What does NLP stand for?", ["Natural Language Processing", "Network Language Program", "Natural Logic Protocol", "Neural Learning Process"], 0],
    ["Which is a common AI application?", ["Recommendation systems", "Keyboard lighting", "Paper printing", "USB charging"], 0],
    ["Which approach uses rules explicitly encoded by humans?", ["Rule-based AI", "Random guessing", "Unsupervised only", "Image compression"], 0],
    ["Knowledge representation is about:", ["Representing knowledge for machine reasoning", "Storing electricity", "Formatting websites", "Printing documents"], 0],
    ["Search algorithms in AI can be used for:", ["Finding paths or solutions", "Charging devices", "Creating batteries", "Formatting text"], 0],
    ["A* is a:", ["Search algorithm", "Database", "Programming language", "Operating system"], 0],
    ["What is an intelligent agent?", ["A system that perceives and acts", "Only a database", "Only a sensor", "A web server only"], 0],
    ["Reinforcement learning learns through:", ["Rewards and penalties", "Only labeled examples", "Only SQL queries", "Only static rules"], 0],
    ["A dataset is:", ["A collection of data", "A CPU", "A monitor", "A network cable"], 0],
    ["Bias in AI can refer to:", ["Systematic unfair or skewed behavior", "CPU temperature only", "Screen brightness", "Disk speed"], 0],
    ["Explainability means:", ["Understanding why a model produced an output", "Making models faster only", "Deleting data", "Adding more screens"], 0],
    ["Hallucination in generative AI means:", ["Generating unsupported or incorrect information", "Improving accuracy", "Compressing data", "Training hardware"], 0],
    ["RAG can help an AI system:", ["Ground answers in retrieved sources", "Remove all databases", "Avoid all computation", "Replace the operating system"], 0],
    ["An embedding represents:", ["Information as a numerical vector", "A physical cable", "A database password", "A monitor"], 0],
    ["Vector databases are useful for:", ["Similarity search", "Video cables", "Power supply", "Keyboard input"], 0],
    ["Fine-tuning means:", ["Further training a model on a targeted dataset", "Changing screen resolution", "Deleting the model", "Installing RAM"], 0],
    ["An AI evaluation metric is used to:", ["Measure model performance", "Charge the computer", "Store passwords", "Create folders"], 0],
    ["Responsible AI includes:", ["Safety, fairness and transparency", "Ignoring errors", "Removing all human oversight", "Using any data without concern"], 0],
  ],
};

function genericQuestions(subject) {
  const templates = [
    [`What is the main purpose of studying ${subject}?`, [`Understanding core concepts`, `Avoiding all practice`, `Memorizing random text`, `Skipping examples`], 0],
    [`Which approach is best when learning ${subject}?`, [`Understand concepts and practice`, `Only memorize answers`, `Never review mistakes`, `Skip fundamentals`], 0],
    [`What should you do after learning a new ${subject} concept?`, [`Practice with examples`, `Immediately forget it`, `Avoid questions`, `Skip revision`], 0],
    [`Which is important for improving in ${subject}?`, [`Consistent practice`, `No revision`, `Random guessing`, `Avoiding feedback`], 0],
    [`What is a good way to prepare for a ${subject} exam?`, [`Learn, practice and revise`, `Study only the night before`, `Ignore weak areas`, `Avoid mock tests`], 0],
    [`Why are examples useful while learning ${subject}?`, [`They connect concepts to practical situations`, `They replace all theory`, `They remove the need for practice`, `They make revision unnecessary`], 0],
    [`What should a learner do after making a mistake in ${subject}?`, [`Understand and correct the mistake`, `Ignore it`, `Repeat it intentionally`, `Stop learning`], 0],
    [`Which habit improves long-term learning of ${subject}?`, [`Spaced revision`, `No revision`, `Random study`, `Skipping practice`], 0],
    [`Why should important concepts be reviewed regularly?`, [`To strengthen understanding and recall`, `To avoid learning`, `To reduce practice`, `To remove examples`], 0],
    [`Which activity best checks understanding of ${subject}?`, [`Solving questions without looking at answers`, `Copying notes only`, `Reading titles only`, `Skipping exercises`], 0],
    [`What is a useful exam strategy for ${subject}?`, [`Manage time and attempt known questions carefully`, `Spend all time on one question`, `Never review answers`, `Guess everything`], 0],
    [`What should a learner identify before starting ${subject} preparation?`, [`Syllabus and learning goals`, `Only the final score`, `Random topics`, `Unrelated subjects`], 0],
    [`Which method can reveal weak areas in ${subject}?`, [`Practice tests and error analysis`, `Avoiding tests`, `Skipping feedback`, `Only reading summaries`], 0],
    [`Why are important questions useful in ${subject}?`, [`They help focus revision on likely concepts and applications`, `They replace the syllabus`, `They guarantee an exact exam paper`, `They remove the need for concepts`], 0],
    [`What should a good revision plan for ${subject} include?`, [`Concepts, practice and revision`, `Only memorization`, `Only difficult questions`, `No breaks`], 0],
    [`Which is a strong learning habit for ${subject}?`, [`Taking short notes after understanding`, `Copying without understanding`, `Avoiding examples`, `Skipping review`], 0],
    [`How can you improve accuracy in ${subject}?`, [`Analyze mistakes and practice similar problems`, `Avoid all questions`, `Never check answers`, `Study unrelated material`], 0],
    [`What should you do before an important ${subject} exam?`, [`Review key concepts and practice questions`, `Start an unrelated topic`, `Avoid sleep`, `Skip revision`], 0],
    [`Which resource is most useful for exam preparation in ${subject}?`, [`Official syllabus and reliable study material`, `Random unverified claims`, `Unrelated notes`, `Only social media comments`], 0],
    [`What does active recall mean when studying ${subject}?`, [`Trying to remember information without looking at notes`, `Reading the same page repeatedly`, `Copying text`, `Highlighting every word`], 0],
    [`What is the benefit of mock tests for ${subject}?`, [`They simulate practice and reveal weak areas`, `They guarantee the exact exam paper`, `They replace all learning`, `They remove the syllabus`], 0],
    [`Which technique helps break a large ${subject} syllabus into manageable parts?`, [`Topic-wise planning`, `Random studying`, `No schedule`, `Skipping fundamentals`], 0],
    [`Why should learners track mistakes in ${subject}?`, [`To identify recurring weaknesses`, `To hide errors`, `To avoid practice`, `To increase confusion`], 0],
    [`What is concept-based learning in ${subject}?`, [`Understanding why and how something works`, `Only memorizing definitions`, `Only copying notes`, `Skipping examples`], 0],
    [`Which is better before solving a difficult ${subject} question?`, [`Understand what the question asks`, `Guess immediately`, `Skip every difficult question`, `Change the subject`], 0],
    [`Why is time management important in a ${subject} quiz?`, [`It helps allocate time across questions`, `It guarantees every answer is correct`, `It removes difficult questions`, `It replaces preparation`], 0],
    [`What should you do when a ${subject} topic is unclear?`, [`Break it into smaller concepts and seek an explanation`, `Memorize blindly`, `Ignore it forever`, `Stop practicing`], 0],
    [`Which learning cycle is effective for ${subject}?`, [`Learn → Practice → Review → Improve`, `Guess → Submit → Forget`, `Read → Stop`, `Skip → Repeat`], 0],
    [`Why should examples match the subject being studied?`, [`They make the concept easier to understand in context`, `They eliminate theory`, `They guarantee exam questions`, `They replace revision`], 0],
    [`What is the purpose of a final revision before a ${subject} exam?`, [`Strengthen recall of important concepts and mistakes`, `Learn every topic from zero`, `Avoid all questions`, `Stop practicing`], 0],
  ];

  return templates;
}

function getQuestions(subject) {
  const bank = QUESTION_BANKS[subject] || genericQuestions(subject);

  return bank.slice(0, 30).map((item, index) => ({
    id: `${subject}-${index + 1}`,
    question: item[0],
    options: item[1],
    answer: item[2],
  }));
}

function formatTime(seconds) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getSubjects(preparationType, exam) {
  return EXAM_DATA[preparationType]?.subjects?.[exam] || [];
}

export default function Quizzes() {
  const [step, setStep] = useState("exam");

  const [preparationType, setPreparationType] = useState("Government Exams");
  const [selectedExam, setSelectedExam] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");

  const [difficulty, setDifficulty] = useState("Mixed");
  const [duration, setDuration] = useState("30");
  const [negativeMarking, setNegativeMarking] = useState(false);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const availableExams = useMemo(
    () => EXAM_DATA[preparationType]?.exams || [],
    [preparationType]
  );

  const availableSubjects = useMemo(
    () => getSubjects(preparationType, selectedExam),
    [preparationType, selectedExam]
  );

  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    if (step !== "quiz") return;

    if (timeLeft <= 0) {
      submitQuiz(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previous) => Math.max(0, previous - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const selectPreparationType = (type) => {
    setPreparationType(type);
    setSelectedExam("");
    setSelectedSubject("");
    setStep("exam");
  };

  const selectExam = (exam) => {
    setSelectedExam(exam);
    const subjects = getSubjects(preparationType, exam);
    setSelectedSubject(subjects[0] || "");
    setStep("subject");
  };

  const selectSubject = (subject) => {
    setSelectedSubject(subject);
    setStep("configure");
  };

  const startQuiz = () => {
    if (!selectedExam || !selectedSubject) return;

    setLoading(true);

    const generated = getQuestions(selectedSubject);

    setTimeout(() => {
      setQuestions(generated);
      setAnswers({});
      setCurrentIndex(0);
      setResult(null);
      setTimeLeft(Number(duration) * 60);
      setStep("quiz");
      setLoading(false);
    }, 250);
  };

  const chooseAnswer = (optionIndex) => {
    if (!currentQuestion) return;

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex((previous) => previous - 1);
    }
  };

  const calculateResult = () => {
    let correct = 0;
    let wrong = 0;
    let unanswered = 0;

    questions.forEach((question) => {
      const selected = answers[question.id];

      if (selected === undefined) {
        unanswered += 1;
      } else if (selected === question.answer) {
        correct += 1;
      } else {
        wrong += 1;
      }
    });

    const attempted = correct + wrong;

    const score = negativeMarking
      ? correct - wrong * 0.25
      : correct;

    const percentage = Math.max(
      0,
      Math.round((score / questions.length) * 100)
    );

    return {
      correct,
      wrong,
      unanswered,
      attempted,
      score,
      percentage,
      total: questions.length,
      exam: selectedExam,
      subject: selectedSubject,
      preparationType,
      duration: Number(duration),
      negativeMarking,
    };
  };

  const submitQuiz = (automatic = false) => {
    if (!questions.length) return;

    const calculated = calculateResult();

    const finalResult = {
      ...calculated,
      automatic,
      completedAt: new Date().toISOString(),
    };

    setResult(finalResult);

    try {
      const existing = JSON.parse(
        localStorage.getItem(RESULT_KEY) || "[]"
      );

      localStorage.setItem(
        RESULT_KEY,
        JSON.stringify([finalResult, ...existing].slice(0, 20))
      );
    } catch {
      // Ignore localStorage errors.
    }

    setStep("result");
  };

  const restartQuiz = () => {
    setStep("configure");
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
    setTimeLeft(Number(duration) * 60);
  };

  const backToStart = () => {
    setStep("exam");
    setSelectedExam("");
    setSelectedSubject("");
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setCurrentIndex(0);
  };

  const progressPercent = questions.length
    ? ((currentIndex + 1) / questions.length) * 100
    : 0;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="quiz-page">
      <div className="quiz-shell">

        <header className="quiz-header">
          <div>
            <div className="quiz-eyebrow">
              <Zap size={15} />
              EDU TRACE QUIZ ARENA
            </div>

            <h1>Test your knowledge.</h1>

            <p>
              Choose your exam, focus on a subject, and challenge yourself
              with a 30-question AI-ready practice session.
            </p>
          </div>

          {step === "quiz" && (
            <div className={`quiz-timer ${timeLeft <= 60 ? "danger" : ""}`}>
              <Clock3 size={18} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}
        </header>

        {step !== "quiz" && step !== "result" && (
          <div className="quiz-stepper">
            {[
              ["exam", "01", "Exam"],
              ["subject", "02", "Subject"],
              ["configure", "03", "Configure"],
            ].map(([key, number, label], index) => {
              const active =
                key === step ||
                (step === "subject" && key === "exam") ||
                (step === "configure" && ["exam", "subject"].includes(key));

              return (
                <React.Fragment key={key}>
                  <div className={`quiz-progress-step ${active ? "active" : ""}`}>
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </div>

                  {index < 2 && <div className="quiz-progress-line" />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {step === "exam" && (
          <section className="quiz-card">
            <div className="quiz-section-title">
              <div className="quiz-icon">
                <Target size={22} />
              </div>
              <div>
                <span>STEP 01</span>
                <h2>Choose your preparation type</h2>
                <p>Select the learning area you want to practice.</p>
              </div>
            </div>

            <div className="quiz-prep-grid">
              {Object.keys(EXAM_DATA).map((type) => (
                <button
                  key={type}
                  className={`quiz-prep-card ${
                    preparationType === type ? "selected" : ""
                  }`}
                  onClick={() => selectPreparationType(type)}
                >
                  <div className="quiz-prep-icon">
                    <BookOpen size={21} />
                  </div>
                  <div>
                    <strong>{type}</strong>
                    <span>{EXAM_DATA[type].exams.length} options</span>
                  </div>
                  {preparationType === type && <Check size={18} />}
                </button>
              ))}
            </div>

            <div className="quiz-divider" />

            <div className="quiz-section-title compact">
              <div className="quiz-icon">
                <Award size={20} />
              </div>
              <div>
                <span>SELECT EXAM</span>
                <h2>What are you preparing for?</h2>
              </div>
            </div>

            <div className="quiz-option-grid">
              {availableExams.map((exam) => (
                <button
                  key={exam}
                  className={`quiz-option ${
                    selectedExam === exam ? "selected" : ""
                  }`}
                  onClick={() => selectExam(exam)}
                >
                  <span>{exam}</span>
                  {selectedExam === exam && <Check size={17} />}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "subject" && (
          <section className="quiz-card">
            <button className="quiz-back-link" onClick={() => setStep("exam")}>
              <ArrowLeft size={17} />
              Change exam
            </button>

            <div className="quiz-section-title">
              <div className="quiz-icon">
                <BookOpen size={22} />
              </div>
              <div>
                <span>STEP 02 · {selectedExam}</span>
                <h2>Choose your subject</h2>
                <p>Questions will be generated specifically for this subject.</p>
              </div>
            </div>

            <div className="quiz-option-grid subject-grid">
              {availableSubjects.map((subject) => (
                <button
                  key={subject}
                  className={`quiz-option ${
                    selectedSubject === subject ? "selected" : ""
                  }`}
                  onClick={() => selectSubject(subject)}
                >
                  <div>
                    <strong>{subject}</strong>
                    <small>30 questions available</small>
                  </div>
                  {selectedSubject === subject && <Check size={18} />}
                </button>
              ))}
            </div>

            <div className="quiz-actions">
              <button
                className="quiz-btn secondary"
                onClick={() => setStep("exam")}
              >
                <ChevronLeft size={18} />
                Back
              </button>

              <button
                className="quiz-btn primary"
                disabled={!selectedSubject}
                onClick={() => setStep("configure")}
              >
                Configure Quiz
                <ArrowRight size={18} />
              </button>
            </div>
          </section>
        )}

        {step === "configure" && (
          <section className="quiz-card">
            <button
              className="quiz-back-link"
              onClick={() => setStep("subject")}
            >
              <ArrowLeft size={17} />
              Change subject
            </button>

            <div className="quiz-section-title">
              <div className="quiz-icon">
                <Target size={22} />
              </div>
              <div>
                <span>STEP 03 · READY TO PLAY</span>
                <h2>Configure your quiz</h2>
                <p>
                  Your quiz will contain exactly <strong>30 questions</strong>.
                </p>
              </div>
            </div>

            <div className="quiz-selected-banner">
              <div>
                <span>{preparationType}</span>
                <strong>{selectedExam}</strong>
                <small>{selectedSubject}</small>
              </div>

              <div className="quiz-30-badge">
                <strong>30</strong>
                <span>QUESTIONS</span>
              </div>
            </div>

            <div className="quiz-config-grid">
              <label className="quiz-field">
                <span>Difficulty</span>
                <select
                  value={difficulty}
                  onChange={(event) => setDifficulty(event.target.value)}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                  <option>Mixed</option>
                </select>
              </label>

              <label className="quiz-field">
                <span>Time Limit</span>
                <select
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                >
                  <option value="20">20 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </label>
            </div>

            <button
              className={`quiz-toggle ${
                negativeMarking ? "enabled" : ""
              }`}
              onClick={() => setNegativeMarking((value) => !value)}
            >
              <span className="quiz-toggle-track">
                <span />
              </span>

              <div>
                <strong>Negative marking</strong>
                <small>−0.25 marks for every incorrect answer</small>
              </div>
            </button>

            <div className="quiz-rules">
              <div>
                <Check size={16} />
                Exactly 30 questions
              </div>
              <div>
                <Check size={16} />
                Subject-specific questions
              </div>
              <div>
                <Check size={16} />
                Instant result and review
              </div>
            </div>

            <div className="quiz-actions">
              <button
                className="quiz-btn secondary"
                onClick={() => setStep("subject")}
              >
                <ChevronLeft size={18} />
                Back
              </button>

              <button
                className="quiz-btn primary large"
                onClick={startQuiz}
                disabled={loading}
              >
                {loading ? "Preparing..." : "Start 30 Question Quiz"}
                {!loading && <ArrowRight size={19} />}
              </button>
            </div>
          </section>
        )}

        {step === "quiz" && currentQuestion && (
          <section className="quiz-play-area">
            <div className="quiz-play-top">
              <div>
                <span className="quiz-play-label">
                  {selectedExam} · {selectedSubject}
                </span>
                <strong>
                  Question {currentIndex + 1} of {questions.length}
                </strong>
              </div>

              <div className="quiz-answer-count">
                {answeredCount}/{questions.length} answered
              </div>
            </div>

            <div className="quiz-question-progress">
              <div
                className="quiz-question-progress-bar"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="quiz-question-layout">
              <aside className="quiz-question-nav">
                <div className="quiz-nav-title">QUESTIONS</div>

                <div className="quiz-number-grid">
                  {questions.map((question, index) => {
                    const answered = answers[question.id] !== undefined;
                    const active = currentIndex === index;

                    return (
                      <button
                        key={question.id}
                        className={`${active ? "active" : ""} ${
                          answered ? "answered" : ""
                        }`}
                        onClick={() => setCurrentIndex(index)}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="quiz-legend">
                  <span>
                    <i className="current" />
                    Current
                  </span>
                  <span>
                    <i className="done" />
                    Answered
                  </span>
                </div>
              </aside>

              <main className="quiz-question-card">
                <div className="quiz-question-meta">
                  <span>QUESTION {String(currentIndex + 1).padStart(2, "0")}</span>
                  <span>{difficulty}</span>
                </div>

                <h2>{currentQuestion.question}</h2>

                <div className="quiz-answer-list">
                  {currentQuestion.options.map((option, index) => {
                    const selected =
                      answers[currentQuestion.id] === index;

                    return (
                      <button
                        key={option}
                        className={`quiz-answer ${
                          selected ? "selected" : ""
                        }`}
                        onClick={() => chooseAnswer(index)}
                      >
                        <span className="quiz-answer-letter">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span className="quiz-answer-text">{option}</span>

                        {selected && (
                          <span className="quiz-selected-check">
                            <Check size={16} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="quiz-navigation">
                  <button
                    className="quiz-btn secondary"
                    disabled={currentIndex === 0}
                    onClick={previousQuestion}
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>

                  {currentIndex < questions.length - 1 ? (
                    <button
                      className="quiz-btn primary"
                      onClick={nextQuestion}
                    >
                      Next Question
                      <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button
                      className="quiz-btn submit"
                      onClick={() => submitQuiz(false)}
                    >
                      Submit Quiz
                      <Check size={18} />
                    </button>
                  )}
                </div>
              </main>
            </div>
          </section>
        )}

        {step === "result" && result && (
          <section className="quiz-result-page">
            <div className="quiz-result-hero">
              <div className="quiz-result-icon">
                <Trophy size={34} />
              </div>

              <span>QUIZ COMPLETED</span>

              <h2>
                {result.percentage >= 80
                  ? "Excellent work! 🎉"
                  : result.percentage >= 60
                  ? "Great job! Keep going."
                  : result.percentage >= 40
                  ? "Good attempt. Let's improve."
                  : "Keep practicing. You've got this."}
              </h2>

              <p>
                {result.exam} · {result.subject}
              </p>

              <div className="quiz-score">
                <strong>{result.percentage}%</strong>
                <span>
                  {result.score} / {result.total} marks
                </span>
              </div>
            </div>

            <div className="quiz-result-stats">
              <div className="result-stat">
                <span className="stat-icon correct">
                  <Check size={17} />
                </span>
                <div>
                  <strong>{result.correct}</strong>
                  <span>Correct</span>
                </div>
              </div>

              <div className="result-stat">
                <span className="stat-icon wrong">
                  <X size={17} />
                </span>
                <div>
                  <strong>{result.wrong}</strong>
                  <span>Wrong</span>
                </div>
              </div>

              <div className="result-stat">
                <span className="stat-icon unanswered">
                  <Clock3 size={17} />
                </span>
                <div>
                  <strong>{result.unanswered}</strong>
                  <span>Unanswered</span>
                </div>
              </div>

              <div className="result-stat">
                <span className="stat-icon attempted">
                  <Target size={17} />
                </span>
                <div>
                  <strong>{result.attempted}</strong>
                  <span>Attempted</span>
                </div>
              </div>
            </div>

            {result.automatic && (
              <div className="quiz-timeout-message">
                <Clock3 size={17} />
                Time ended. Your answers were submitted automatically.
              </div>
            )}

            <div className="quiz-review">
              <div className="quiz-review-header">
                <div>
                  <span>REVIEW</span>
                  <h3>Question-by-question analysis</h3>
                </div>
              </div>

              {questions.map((question, index) => {
                const selected = answers[question.id];
                const isCorrect = selected === question.answer;
                const unanswered = selected === undefined;

                return (
                  <div
                    key={question.id}
                    className={`quiz-review-item ${
                      unanswered
                        ? "unanswered"
                        : isCorrect
                        ? "quiz-correct"
                        : "quiz-wrong"
                    }`}
                  >
                    <div className="review-number">
                      {index + 1}
                    </div>

                    <div className="review-content">
                      <strong>{question.question}</strong>

                      <div className="review-answer-line">
                        <span>
                          Your answer:{" "}
                          <b>
                            {unanswered
                              ? "Not answered"
                              : question.options[selected]}
                          </b>
                        </span>

                        {!unanswered && (
                          <span>
                            Correct answer:{" "}
                            <b>{question.options[question.answer]}</b>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="review-status">
                      {unanswered ? (
                        <Clock3 size={17} />
                      ) : isCorrect ? (
                        <Check size={18} />
                      ) : (
                        <X size={18} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="quiz-result-actions">
              <button className="quiz-btn secondary" onClick={backToStart}>
                <ArrowLeft size={18} />
                Choose Another Quiz
              </button>

              <button className="quiz-btn primary" onClick={restartQuiz}>
                <RotateCcw size={18} />
                Retry Quiz
              </button>
            </div>
          </section>
        )}

      </div>
    </div>
  );
}
