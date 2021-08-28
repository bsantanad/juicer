"use strict";
function main() {
  /* get canvas from html*/
  var canvas = document.querySelector("#c");
  canvas.width = 400;
  canvas.height = 300;

  var gl = canvas.getContext("webgl");
  if (!gl) {
    console.log("cant run webgl");
    return;
  }
    
  /* get shader scripts from html */
  var vertexShaderSource = document.querySelector("#vertex-shader-2d").text;
  var fragmentShaderSource = document.querySelector("#fragment-shader-2d").text;

  /* create shaders from script and create program */
  var vertexShader = webgl_utils.createShader(gl,
                                    gl.VERTEX_SHADER, vertexShaderSource);
  var fragmentShader = webgl_utils.createShader(gl,
                                    gl.FRAGMENT_SHADER, fragmentShaderSource);
  var program = webgl_utils.createProgram(gl, vertexShader, fragmentShader);
}
