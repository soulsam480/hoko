## Hōkō
> direction in japanesse

Experimental community BMTC bus tracking app which aims to be accurate in tracking and not navigation.

## Theory
- based on BMTC gtfs data, https://github.com/Vonter/bmtc-gtfs, we can plot all stops on map
- take user gps coords, and find closest stops to their location.
- before start of tracking, show all routes based on closest stops
- once a route is chosen for tracking, ask if they're in the bus
- if yes, take them as a source of data and broadcast location to server
- every person that joins in, if they choose a route, check if someone is currently on a route and sending tracking data
- poll data and track the bus/route


## Challenges
- accuracy of data <- based on gps location permissions, corrdinates may or may not be on road
- human errors in chosing wrong route and then tracking may send completely different coordinates for the route
- e.g. a bus can be going from whitefield to majestic, but someone in E-City, may start sending tracking data and all is messed up
- handling lot of live tracking data, in memory or disk
- keeping a server as relay may be a bottleneck, we can try peer to peer

## Implementation details
- init map and plot user location
- extract all stops from db and show closet stops and routes
- once a route is chosen, comm with server and start sending location data and chosen route
- if they're inside bus, ask them to choose role, if yes register them as source and broadcast
- if they're not, check for route topic, the're will be multiple available or empty
  - if many are available ask to choose which one based on location and timing
  - once chosen, subscribe and keep plotting

## Early screenshots
![image](https://github.com/user-attachments/assets/a2565e68-fc7a-4bb1-9437-7f9898bb8a9b)
![image](https://github.com/user-attachments/assets/63473e8b-cc46-4979-a09d-6bae0c970951)
![image](https://github.com/user-attachments/assets/a13c4db3-9720-4968-8ec4-afdd74e85e4a)
![image](https://github.com/user-attachments/assets/5916564a-88e3-4cc4-824b-7371ba7814be)
