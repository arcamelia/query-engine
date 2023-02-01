Please edit this template and commit to the master branch for your user stories submission.   
Make sure to follow the *Role, Goal, Benefit* framework for the user stories and the *Given/When/Then* framework for the Definitions of Done! You can also refer to the examples DoDs in [C3 spec](https://sites.google.com/view/ubc-cpsc310-21w2-intro-to-se/project/checkpoint-3).

## User Story 1
As a student, if I enter a department and a course code, I want to see all the professors that have previously taught that course, as well as their respective grade averages and their average number of fails, so that I can decide which professor I want to take that course with.

#### Definitions of Done(s)
- **Scenario 1:** Valid department  
  - *Given:* User is on the interface  
  - *When:* User enters a value in both the department and course code fields, then clicks a “get results” button  
  - *Then:* List of professors that have taught that course, their respective average grades & average number of fails is populated in window  

- **Scenario 2:** Invalid department type (i.e., department is a number not a string)
  - *Given:* User is on the interface  
  - *When:* User enters a numeric value in department field (and any value in the course code field), then clicks a “get results” button  
  - *Then:* An error is thrown in the backend (since department must be a string) that is caught and then displays an error msg in the frontend   


## User Story 2
As a first year student, if I select my residence and enter a building name, I want to see the distance from that building to my residence, so that I can schedule my classes based on how long it will take me to get to the building they’re held in.

#### Definitions of Done(s)
- **Scenario 1:** Valid building name type and existing name building given  
  - *Given:* User is on the interface  
  - *When:* User enters a building name and clicks a “get results” button  
  - *Then:* The interface will display the amount of time it takes to get from residence to the building  

- **Scenario 2:** Invalid building name type given (number instead of string)  
  - *Given:* User is on the interface  
  - *When:* User enters a numeric value as the building name and clicks a “get results” button  
  - *Then:* An error is thrown in the backend (since building name must be a string) and then displays an error msg in the frontend

## Others
You may provide any additional user stories + DoDs in this section for general TA feedback.  
Note: These will not be graded.
