import * as THREE from '../ThreeJs/three.module.js';
import { GLTFLoader } from '../ThreeJs/GLTFLoader.js';
import { OrbitControls } from '../ThreeJs/OrbitControls.js';

// Scene
var scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xcce0ff, 1, 80);
scene.background = new THREE.Color( 0xcce0ff );

// Renderer
var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;

// Camera
    //  PerspectiveCamera(góc nhìn (độ), tỉ lệ khung hình cam, min distance from plane, max ...)
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(10, 10, 10);
    camera.lookAt(0, 0, 0);
    // let camera control scene
    let controls = new OrbitControls(camera, renderer.domElement);
        controls.addEventListener('change', renderer);


// Ground 
var groundGeo = new THREE.PlaneBufferGeometry( 500, 500);
var groundMat = new THREE.MeshLambertMaterial( { color: 0x2E9AFE} );

var ground = new THREE.Mesh( groundGeo, groundMat );
    ground.position.y = -3;
	ground.rotation.x = -Math.PI/2;
    ground.receiveShadow = true;
    scene.add( ground );

// Lights
    
    var ambientLight = new THREE.AmbientLight(0xadadad, 1.0);
    scene.add(ambientLight);

    var directionalLight = new THREE.DirectionalLight( 0xffffff, .5);  // màu vàng nhạt
    directionalLight.position.set(0, 1000, 0);
    directionalLight.castShadow = true;
    scene.add( directionalLight ); 
    
// Creat grid and main coordinate axes
function drawGrid(){
        
    // Grid
    var grid = new THREE.GridHelper(500, 500, 0x0000ff, 0x084B8A);
    scene.add(grid); // add grid to scene
    // draws line
    var line = (x1, y1, z1, x2, y2, z2, linecolor) => {
        let material = new THREE.LineBasicMaterial({color: linecolor, opacity: 1, linewidth: 10.0, linecap: "round", linejoin: "round"});
        let points = [
            new THREE.Vector3(x1, y1, z1),  // start point
            new THREE.Vector3(x2, y2, z2)    // end point
        ];
        let geometry = new THREE.Geometry().setFromPoints(points);
        return new THREE.Line(geometry, material);
    };

    // Main coordianate axis
    scene.add(line(-250, 0, 0, 250, 0, 0, 0xff0000));    // X axis
    scene.add(line(0, -250, 0, 0, 250, 0, 0x00ff00));    // Y axis
    scene.add(line(0, 0, -250, 0, 0, 250, 0x0000ff));    // Z axis
}

let btnGrid = document.getElementById("btn_grid");
    btnGrid.addEventListener("click", function(){
    drawGrid();
    btnGrid.style.backgroundColor = "rgba(0, 255, 0, .6)";
    btnGrid.style.color = "white";
    btnGrid.innerHTML = "Grid Activated!";
}, true);

var defaultNumOfScene_children = scene.children.length + 1;

// Array of link Objects
var src = ['Curious_skeleton', 'Dragon', 'Flying_bee', 'Flying_saucer', 'Hovering_drone', 'Links', 'Pirate_parrot', 'Skating_penguin', 'Swimming_shark', 'Coming soon ...'];

// add event for each button of vertical Menu
var vtMenu = document.getElementById("verticalMenu");
for (let i=0; i < src.length; i++) {
    let vtbtn = document.createElement("button");
    vtbtn.className = "vt_button";
    vtbtn.title = src[i];
    vtbtn.innerHTML = src[i];
    vtbtn.value = i + 1;
    vtMenu.appendChild(vtbtn);
}
for (let i=0; i < vtMenu.children.length - 1; i++){
    vtMenu.children[i].addEventListener("click", (event) => {

        getObject(event.target);
    })
}

function getObject( elm ){
    
    // reset effect of all vtMenu children
    for(let j=0; j< vtMenu.children.length; j++) {
        let elmbtn = vtMenu.children[j];
        elmbtn.style.backgroundColor = "rgba(255, 0, 0, .6)";
        elmbtn.style.color = "green";
    }
    // keep active effect of elm
    elm.style.backgroundColor = "rgba(0, 255, 0, .6)";
    elm.style.color = "white";
    // init loader to load object
    var loader = new GLTFLoader();
    var model;  
    loader.load(
        // resource URL
        './' + src[elm.value - 1] + '.glb',

        function ( glb ) {
            
            // attach object to scene
            model = glb.scene;
            if (scene.children.length >= defaultNumOfScene_children) 
                scene.children[defaultNumOfScene_children - 1] = model; // replace recent object if it exist
            else
                scene.add(model);

            // do somethings
            ControlObject( model, glb.animations);

        }
    );
    }
    
    
// Control 
var mixer, previousAction, activeAction;
var hrMenu = document.getElementById("horizontalMenu");
    //hrMenu.addEventListener("click", changeAction);

function ControlObject(model, animations){
    
    // clear hrMenu children
        while (hrMenu.firstChild) {
            hrMenu.removeChild(hrMenu.firstChild);
        }

    if (animations.length != 0){
        
        // get animations
        mixer = new THREE.AnimationMixer( model);
        for (let i = 0; i< animations.length; i++){
            
            // create button control actions
            var btn = document.createElement("button");
            btn.className = "hr_button";
            btn.title = animations[i].name;
            btn.innerHTML = btn.title;
            btn.value = hrMenu.children.length + 1;
            // add event for button
            btn.addEventListener("click", (event) => {
                fadeToAction( animations[event.target.value - 1], 0.5);

            } , true);

            hrMenu.appendChild(btn);
        }

        activeAction = mixer.clipAction(animations[0]);
    }
    else {
        var btn = document.createElement("button");
        btn.className = "hr_button";
        btn.innerHTML = "No Action!";
        hrMenu.appendChild(btn);
    }
}

// Smoothing effect when changing action
function fadeToAction( animationss, duration ) {

    previousAction = activeAction;
    activeAction = mixer.clipAction(animationss);

    if ( previousAction !== activeAction ) {

        previousAction.fadeOut( duration );

    }

    activeAction
        .reset()
        .setEffectiveTimeScale( 1 )
        .setEffectiveWeight( 1 )
        .fadeIn( duration )
        .play();

}

// Render all things (60fps)
var clock = new THREE.Clock();

function animate() {
    // onWindowResize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
    var dt = clock.getDelta();
    if ( mixer ) mixer.update( dt );
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}
animate();
console.log("04/02/2020 04:45:30 PM\nTrời mưa rét mướt :(");

