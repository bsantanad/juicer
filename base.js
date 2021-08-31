"use strict";


// create empty objects to then fill with the actual polygons
var global = this;
var objects = [];
for (let i=0; i<100; i++) {
    var object = {
      uniforms: {
        u_matrix: m4.identity(),
      },
      translation: [-150, 0, -360],
      rotation: [m4.deg2rad(142), m4.deg2rad(25), m4.deg2rad(325)],
      scale: [1, 1, 1],
    };
    global.objects.push(object);
}

var polygonVertexes = [];
var colorsData = [];

/// helper function that will do all the matrix operations once called
function computeMatrix(viewProjectionMatrix, translation, rotation, scale) {
    var matrix = m4.translate(viewProjectionMatrix,
                              translation[0], translation[1], translation[2]);
    matrix = m4.xRotate(matrix, rotation[0]);
    matrix = m4.yRotate(matrix, rotation[1]);
    matrix = m4.zRotate(matrix, rotation[2]);
    matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    return matrix;
}

function main() {
  /* get canvas from html*/
  var canvas = document.querySelector("#c");
  canvas.width = 600;
  canvas.height = 600;

  var gl = canvas.getContext("webgl");
  if (!gl) {
    console.log("cant run webgl");
    return;
  }


  /* get shader scripts from html */
  var vertexShaderSource = document.querySelector("#vertex-shader-3d").text;
  var fragmentShaderSource = document.querySelector("#fragment-shader-3d").text;

  /* create shaders from script and create program */
  var vertexShader = webgl_utils.createShader(gl,
                                    gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = webgl_utils.createShader(gl,
                                    gl.FRAGMENT_SHADER, fragmentShaderSource);
  var program = webgl_utils.createProgram(gl, vertexShader, fragmentShader);

  /* vertex shader */
  var positionAttrLocation = gl.getAttribLocation(program, "a_position");
  var colorAttrLocation= gl.getAttribLocation(program, "a_color");
  var matrixLocation = gl.getUniformLocation(program, "u_matrix");

  /* fragment shader */
  var colorLocation = gl.getUniformLocation(program, "u_color");

  /* create all the array buffers for the polygons that have been uploaded */
  var shapes = [];
  var objectsToDraw = [];
  let i = 0;
  global.polygonVertexes.forEach(function(vertexList) {
    let polygon = createPolygon(gl, vertexList);
    objectsToDraw.push({
      program: program,
      bufferInfo: polygon,
      uniforms: global.objects[i].uniforms,
      vertexLength: vertexList.length,
    });
    i++;
  });

  /* create the information from the color buffer */
  let colorBuffer = createColor(gl, colorsData[0]);

  var fieldOfViewRadians = m4.deg2rad(60);
  var cameraAngleRadians = m4.deg2rad(0);

  drawScene();

  var shapeIndex = document.getElementById('shape').value
  reloadSliders();
  function reloadSliders(){
    webgl_ui.setupSlider("#move_x",
              {value: global.objects[shapeIndex].translation[0],
               slide: updatePosition(0),
               min: -500,
               max: 200 });
    webgl_ui.setupSlider("#move_y",
             {value: global.objects[shapeIndex].translation[1],
              slide: updatePosition(1),
               min: -200,
               max: 200 });
    webgl_ui.setupSlider("#move_z",
              {value: global.objects[shapeIndex].translation[2],
               slide: updatePosition(2),
               min: -1000,
               max: 0 });

    webgl_ui.setupSlider("#angle_x",
              {value: m4.rad2deg(global.objects[shapeIndex].rotation[0]),
               slide: updateRotation(0),
               max: 360});
    webgl_ui.setupSlider("#angle_y",
              {value: m4.rad2deg(global.objects[shapeIndex].rotation[1]),
               slide: updateRotation(1),
               max: 360});
    webgl_ui.setupSlider("#angle_z",
              {value: m4.rad2deg(global.objects[shapeIndex].rotation[2]),
               slide: updateRotation(2),
               max: 360});

    webgl_ui.setupSlider("#scale_x",
              {value: global.objects[shapeIndex].scale[0],
               slide: updateScale(0),
               min: -5, max: 5, step: 0.01, precision: 2});
    webgl_ui.setupSlider("#scale_y",
              {value: global.objects[shapeIndex].scale[1],
               slide: updateScale(1),
               min: -5, max: 5, step: 0.01, precision: 2});
    webgl_ui.setupSlider("#scale_z",
              {value: global.objects[shapeIndex].scale[2],
               slide: updateScale(2),
               min: -5, max: 5, step: 0.01, precision: 2});

  }
  webgl_ui.setupSlider("#camera",
             {value: m4.rad2deg(cameraAngleRadians),
              slide: updateCameraAngle,
              min: -360, max: 360});

  function updateCameraAngle(event, ui) {
    cameraAngleRadians = m4.deg2rad(ui.value);
    drawScene();
  }

  function updatePosition(index) {
    return function(event, ui) {
      global.objects[shapeIndex].translation[index] = ui.value;
      drawScene();
    };
  }

  function updateRotation(index) {
    return function(event, ui) {
      var angleInDegrees = ui.value;
      var angleInRadians = angleInDegrees * Math.PI / 180;
      global.objects[shapeIndex].rotation[index] = angleInRadians;
      drawScene();
    };
  }

  function updateScale(index) {
    return function(event, ui) {
      global.objects[shapeIndex].scale[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {
    /* clip space to pixels */
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    /* clear canvas */
    gl.clearColor(0.454, 0.325, 0.6, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* dont paint triangles facing backwards */
    //gl.enable(gl.CULL_FACE);

    /* depth has entered the chat */
    gl.enable(gl.DEPTH_TEST);

    /* enable perspective and field of view*/
    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var zNear = 1;
    var zFar = 2000;
    var projectionMatrix = m4.perspective(fieldOfViewRadians, aspect, zNear, zFar);

    /* camera */
    var radius = 200;
    // Compute a matrix for the camera
    // we dont move the camera, the camera stays in the origin the whole time
    // we actually get a matrix that simulates the movement of the camera
    // and then move the whole world at the inverse of that matrix.
    // that gives the effect that we are moving the camera
    var cameraMatrix = m4.yRotation(cameraAngleRadians);
    cameraMatrix = m4.translate(cameraMatrix, 0, 0, radius * 1.5);
    var viewMatrix = m4.inverse(cameraMatrix);
    var viewProjectionMatrix = m4.multiply(projectionMatrix, viewMatrix);

    // compute matrix for each object
    objects.forEach(function(object) {
        object.uniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        object.translation,
        object.rotation,
        object.scale);
    });

    // for each polygon we'll enable the attribute bind the buffer tell webgl
    // how to read from that buffer and fill the attribute
    objectsToDraw.forEach(function(object) {
        gl.useProgram(object.program);
        gl.enableVertexAttribArray(positionAttrLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, object.bufferInfo);

        var size = 3;
        var type = gl.FLOAT;
        var normalize = false;
        var stride = 0;
        var offset = 0;
        gl.vertexAttribPointer(
            positionAttrLocation, size, type, normalize, stride, offset);

        // color buffer, same idea as above
        gl.enableVertexAttribArray(colorAttrLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        /* tell the attr how to read data from buffer */
        var size = 3;
        var type = gl.UNSIGNED_BYTE;
        var normalize = true; // convert 0-255 to 0-1
        var stride = 0;
        var offset = 0;
        gl.vertexAttribPointer(
            colorAttrLocation, size, type, normalize, stride, offset);

        // Set the matrix.
        gl.uniformMatrix4fv(matrixLocation, false, object.uniforms.u_matrix);

        // Draw the geometry.
        var primitiveType = gl.TRIANGLES;
        var offset = 0;
        var count = object.vertexLength / 3;
        gl.drawArrays(primitiveType, offset, count);

    });
  }
  return {
    reloadSliders: reloadSliders
  }
}

// create polygon array of vertices
function createPolygon(gl, array) {
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(array),
      gl.STATIC_DRAW);
  return positionBuffer;
}

// create color array of vertices
function createColor(gl, array) {
  var colorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(
      gl.ARRAY_BUFFER,
      new Uint8Array(array),
      gl.STATIC_DRAW);
  return colorBuffer;
 }

/// read polygon file from html
const polyFile= document.getElementById('poly-file');
polyFile.addEventListener('change', (event) => {
  const fileList = event.target.files;
  let fileContent = "";

  const fr = new FileReader();
  fr.onload = () => {
    fileContent = fr.result;
    buildArrayPoly(fileContent);
  }
  fr.readAsText(fileList[0]);
});

function buildArrayPoly(coords){
    let numCoords = [];
    let coordsStr = coords.split('\n');
    coordsStr.forEach(function(coord) {
        let coordStr = coord.split(',')
        coordStr.forEach(function(number) {
            let num = parseInt(number);
            if (!isNaN(num)) {
              numCoords.push(num);
            }
        });
    });
    global.polygonVertexes.push(numCoords);
    main();
}

/// read color html
const colorFile = document.getElementById('color-file');
colorFile.addEventListener('change', (event) => {
  const fileList = event.target.files;
  let fileContent = "";

  const fr = new FileReader();
  fr.onload = () => {
    fileContent = fr.result;
    buildArrayColors(fileContent);
  }
  fr.readAsText(fileList[0]);
});

function buildArrayColors(coords){
    let numCoords = [];
    let coordsStr = coords.split('\n');
    coordsStr.forEach(function(coord) {
        let coordStr = coord.split(',')
        coordStr.forEach(function(number) {
            let num = parseInt(number);
            if (!isNaN(num)) {
              numCoords.push(num);
            }
        });
    });
    document.getElementById("poly").setAttribute("style", "display:");
    global.colorsData.push(numCoords);
    main();
}


main();
