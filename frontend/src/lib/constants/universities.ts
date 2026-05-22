export interface University {
  name: string;
  search: string; // includes aliases, used for filtering only
}

export const UNIVERSITIES: University[] = [
  // Thailand
  { name: "VISTEC", search: "VISTEC Vidyasirimedhi Institute of Science and Technology" },
  { name: "Chulalongkorn University", search: "Chulalongkorn University Chula CU" },
  { name: "Mahidol University", search: "Mahidol University MU" },
  { name: "King Mongkut's University of Technology Thonburi", search: "KMUTT King Mongkut Thonburi" },
  { name: "King Mongkut's Institute of Technology Ladkrabang", search: "KMITL King Mongkut Ladkrabang" },
  { name: "Kasetsart University", search: "Kasetsart University KU" },
  { name: "Thammasat University", search: "Thammasat University TU" },
  { name: "Asian Institute of Technology", search: "AIT Asian Institute of Technology" },
  { name: "Prince of Songkla University", search: "PSU Prince of Songkla" },
  { name: "Khon Kaen University", search: "KKU Khon Kaen University" },

  // Singapore
  { name: "National University of Singapore", search: "NUS National University of Singapore" },
  { name: "Nanyang Technological University", search: "NTU Nanyang Technological University" },
  { name: "Singapore University of Technology and Design", search: "SUTD Singapore University of Technology and Design" },
  { name: "Singapore Management University", search: "SMU Singapore Management University" },

  // USA
  { name: "Massachusetts Institute of Technology", search: "MIT Massachusetts Institute of Technology" },
  { name: "Stanford University", search: "Stanford" },
  { name: "California Institute of Technology", search: "Caltech California Institute of Technology" },
  { name: "Carnegie Mellon University", search: "CMU Carnegie Mellon" },
  { name: "Harvard University", search: "Harvard" },
  { name: "Princeton University", search: "Princeton" },
  { name: "Yale University", search: "Yale" },
  { name: "Columbia University", search: "Columbia" },
  { name: "Cornell University", search: "Cornell" },
  { name: "University of Pennsylvania", search: "UPenn Penn University of Pennsylvania" },
  { name: "Johns Hopkins University", search: "Johns Hopkins JHU" },
  { name: "Northwestern University", search: "Northwestern" },
  { name: "Duke University", search: "Duke" },
  { name: "Rice University", search: "Rice" },
  { name: "Dartmouth College", search: "Dartmouth" },
  { name: "Brown University", search: "Brown" },
  { name: "University of California, Berkeley", search: "UC Berkeley UCB California Berkeley" },
  { name: "University of California, Los Angeles", search: "UCLA UC Los Angeles California" },
  { name: "University of Michigan", search: "UMich University of Michigan Ann Arbor" },
  { name: "Georgia Institute of Technology", search: "Georgia Tech GT" },
  { name: "University of Illinois Urbana-Champaign", search: "UIUC University of Illinois Urbana-Champaign" },
  { name: "University of Washington", search: "UW University of Washington Seattle" },
  { name: "University of Texas at Austin", search: "UT Austin University of Texas" },
  { name: "University of Wisconsin-Madison", search: "UW-Madison Wisconsin" },
  { name: "Purdue University", search: "Purdue" },
  { name: "New York University", search: "NYU New York University" },
  { name: "University of Southern California", search: "USC University of Southern California" },
  { name: "University of Maryland", search: "UMD University of Maryland College Park" },
  { name: "Penn State University", search: "Penn State Pennsylvania State University" },
  { name: "Ohio State University", search: "OSU Ohio State" },

  // UK
  { name: "University of Oxford", search: "Oxford" },
  { name: "University of Cambridge", search: "Cambridge" },
  { name: "Imperial College London", search: "Imperial College London" },
  { name: "University College London", search: "UCL University College London" },
  { name: "University of Edinburgh", search: "Edinburgh" },
  { name: "University of Manchester", search: "Manchester" },
  { name: "King's College London", search: "KCL King's College London" },
  { name: "University of Bristol", search: "Bristol" },
  { name: "University of Warwick", search: "Warwick" },

  // Europe
  { name: "ETH Zurich", search: "ETH Zurich Swiss Federal Institute" },
  { name: "EPFL", search: "EPFL École Polytechnique Fédérale de Lausanne" },
  { name: "Technical University of Munich", search: "TUM Technical University Munich" },
  { name: "Delft University of Technology", search: "TU Delft Delft" },
  { name: "KTH Royal Institute of Technology", search: "KTH Royal Institute Technology Stockholm" },

  // Japan
  { name: "University of Tokyo", search: "Todai University of Tokyo UTokyo" },
  { name: "Kyoto University", search: "Kyoto University" },
  { name: "Osaka University", search: "Osaka University" },
  { name: "Tokyo Institute of Technology", search: "Tokyo Tech Tokyo Institute of Technology" },
  { name: "Tohoku University", search: "Tohoku University" },
  { name: "Waseda University", search: "Waseda" },
  { name: "Keio University", search: "Keio" },

  // Korea
  { name: "Korea Advanced Institute of Science and Technology", search: "KAIST Korea Advanced Institute" },
  { name: "Pohang University of Science and Technology", search: "POSTECH Pohang" },
  { name: "Seoul National University", search: "SNU Seoul National University" },

  // Australia
  { name: "University of Melbourne", search: "Melbourne UniMelb" },
  { name: "Australian National University", search: "ANU Australian National University" },
  { name: "University of Sydney", search: "USYD University of Sydney" },
  { name: "University of New South Wales", search: "UNSW New South Wales" },
  { name: "University of Queensland", search: "UQ University of Queensland" },
  { name: "Monash University", search: "Monash" },

  // Canada
  { name: "University of Toronto", search: "UofT University of Toronto" },
  { name: "University of British Columbia", search: "UBC British Columbia" },
  { name: "McGill University", search: "McGill" },
  { name: "University of Waterloo", search: "Waterloo" },
];

export const JOB_FIELDS = [
  "Software Engineering",
  "Data Science / AI / ML",
  "Research / Academia",
  "Medicine / Healthcare",
  "Mechanical / Electrical Engineering",
  "Finance / Banking",
  "Consulting",
  "Business / Management",
  "Law",
  "Architecture / Design",
  "Arts / Media / Entertainment",
  "Government / Public Policy",
  "Education",
  "Other",
];
