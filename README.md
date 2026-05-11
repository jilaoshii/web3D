3D Garage Showcase Web Application

Project Overview

This project is an interactive Web 3D application developed for the Web 3D Technologies assignment. The application presents a virtual 3D garage showroom where users can explore multiple car models in a real-time interactive environment using Three.js.

The project demonstrates the integration of modern Web technologies including HTML5, CSS3, JavaScript ES6 Modules, Bootstrap 5, and Three.js to create a responsive and immersive 3D web experience.

The application allows users to:

Interact with 3D vehicle models
Change camera viewpoints
Trigger animations
Modify lighting and material properties
Switch between different car models
Enable wireframe rendering
Explore a responsive user interface

---

Technologies Used

Front-End Technologies

HTML5
CSS3
JavaScript ES6 Modules
Bootstrap 5

3D Technologies

Three.js
GLTF / GLB 3D Models
OrbitControls
HDR Environment Maps
Physically Based Rendering (PBR)

Additional Features

Responsive Web Design
Modular MVC-style JavaScript structure
Interactive UI controls
Real-time rendering
Dynamic lighting manipulation

---

Project Structure


web3D-main/
├── index.html
├── app.html
├── about.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── scene.js
│   ├── models.js
│   ├── controls.js
│   └── animations.js
├── assets/
│   ├── equirectangular/
│   └── models/
│       ├── car1.glb
│       ├── car2.glb
│       ├── car3.glb
│       └── textures/
└── README.md


---

3D Models

Model Design and Optimization

The application uses multiple GLB car models placed within a virtual garage environment. The models were optimized for efficient real-time rendering while maintaining visual quality.

Geometry Optimization

Efficient polygon usage for browser rendering
Optimized model sizes for faster loading
Use of reusable assets and textures

Materials and Textures

The project uses:

Physically Based Rendering (PBR) materials
Reflective surfaces
Metallic car paint effects
Transparent glass materials
Custom wheel materials
High-quality texture maps

Lighting

The scene includes multiple lighting systems:

Ambient lighting
Directional lighting
HDR environment lighting
Dynamic lighting intensity controls

Lighting can be adjusted dynamically through the user interface.

Camera System

The project implements multiple camera viewpoints:

Front view
Rear view
Side view
Top view
Free orbit camera

The camera system uses OrbitControls for smooth interaction.

---

Interactive 3D Application Features

User Interface Design

The application uses Bootstrap 5 to create a responsive and modern interface.

UI Features

Responsive navigation bar
Styled buttons and controls
Real-time interaction panels
Mobile-friendly layout
Dark-themed visual design

Usability

The interface focuses on simple navigation and responsive layout across desktop and mobile devices.

---

Media Integration

The project integrates multiple forms of media including:

3D GLB models
HDR environment textures
Dynamic materials
Real-time animations

3D Content Swapping

Users can:

Switch between different car models
Change vehicle colours
Modify wheel colours
Modify glass colours
Toggle wireframe mode
Adjust lighting colours

This demonstrates dynamic manipulation of 3D content using JavaScript.

---

Interaction with 3D Models

Camera Interaction

The project uses OrbitControls to allow:

Rotation
Zooming
Panning
Smooth camera transitions

Animation Features

The application includes JavaScript-triggered animations such as:

Garage door animations
Vehicle movement animations
Dynamic scene transitions

Animations are controlled through interactive UI buttons.

---

MVC Style Architecture

The project follows a modular JavaScript structure inspired by the MVC design pattern.

Structure Overview

Model Layer

models.js

Responsible for:

Loading GLB models
Material updates
Texture control
Model switching

View Layer

HTML and CSS files:

index.html
app.html
about.html
style.css

Responsible for:

Layout
Styling
User interface

Controller Layer

controls.js
animations.js
main.js

Responsible for:

User interaction
Camera control
Animation triggering
Scene management

---

Design Decisions

Garage Theme

A garage showroom environment was selected because it provides a realistic context for displaying automotive 3D models.

Dark UI Design

A dark-themed interface was used to:

Improve visual contrast
Emphasize lighting effects
Enhance realism of reflections and materials

Responsive Layout

Bootstrap 5 was used to ensure compatibility across:

Desktop devices
Tablets
Mobile devices

Accessibility Considerations

The project considers accessibility through:

Clear navigation
Large interactive buttons
Responsive layouts
Readable typography
Consistent UI structure

---

Demonstrating Deeper Understanding

This project extends the laboratory tutorials by adding:

HDR environment mapping
Dynamic material editing
Real-time lighting controls
Wireframe rendering mode
Modular JavaScript structure
Responsive Bootstrap interface

---

Installation and Running the Project

Option 1 — VS Code Live Server

1. Open the project in Visual Studio Code
2. Install the Live Server extension
3. Right-click `index.html`
4. Select `Open with Live Server`

---

Option 2 — Node.js Local Server

If Node.js is installed:


npx serve .


Then open:


http://localhost:3000


---

Browser Compatibility

The application is compatible with modern browsers including:

Google Chrome
Microsoft Edge
Mozilla Firefox
Safari

WebGL support is required.

---

Future Improvements

Possible future improvements:

GLSL shaders
Post-processing effects
Audio support
AR/VR support
More interactive animations

---

Testing and Publication Evidence

The project was tested locally using:

Visual Studio Code Live Server
Modern desktop browsers
Responsive browser testing

The project is intended to be published through:

GitHub Repository
Web server deployment

Submission evidence should include:

GitHub repository URL
Live server deployment URL
Source code package
README documentation

---

Author
shuaibo huang
Web 3D Technologies Coursework Project
