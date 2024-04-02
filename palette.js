var numColors = document.getElementById("numColors");
var mode = document.getElementById("mode")
var numColorsOP = document.getElementById("numColorsOP")
var p1 = document.getElementById("p1") 
var palName = document.getElementById("palName");
var bayer4x4 = [
    [  0, 8,  2, 10 ],
    [ 12,  4, 14, 6 ],
    [  3, 11,  1, 9 ],
    [ 15, 7, 13,  5 ]
  ];

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
function rgbToHex(c) {
    return componentToHex(c[0]) + "" + componentToHex(c[1]) + "" + componentToHex(c[2]);
}

numColors.oninput = function() {
    numColorsOP.innerHTML = "Number of Colors:"+this.value 
}

$('body').keyup(function(e){
    if(e.keyCode == 32){
        generatePalette()
    }
 });

function lerp( a, b, alpha ) {
    return a + alpha * ( b - a )
}

function parse(data){
    palName.innerHTML = data.paletteTitle
}

function getPaletteName(colors){
    vales = ""
    for(let i = 0; i < colors.length-1; i++){
        vales += colors[i]+","
    }
    vales += colors[colors.length-1]

    $.ajax({
        url: "https://api.color.pizza/v1/?values="+vales,
        type: "get",
        dataType: "json",
        success: function (data) {
            parse(data)
        }
    });
}

function getClosestColor(curColor, colors){
    var dist = Infinity
    var distInd = 0
    for(let c = 0; c < colors.length; c++){
        palCol = colors[c]
        curDist = Math.sqrt(Math.pow(palCol[0]-curColor[0], 2)+Math.pow(palCol[1]-curColor[1], 2)+Math.pow(palCol[2]-curColor[2], 2))
        if(curDist < dist){
            dist = curDist
            distInd = c
        }
    }
    return colors[distInd]
}

function quantize(colors) {
    const canvas = document.getElementById("sample")
    const ctx = canvas.getContext("2d")
    const img = document.getElementById("sampleimg")
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    var imagedata = ctx.getImageData(0,0, canvas.width, canvas.height)
    
    for (var i = 0; i <= imagedata.data.length; i += 4) {
        var x = i / 4 % canvas.width;
        var y = Math.floor(i / 4 / canvas.width);
        var curColor = [
            imagedata.data[i+0] + (255/numColors.value)*(bayer4x4[x % 4][y % 4] * 1/16),
            imagedata.data[i+1] + (255/numColors.value)*(bayer4x4[x % 4][y % 4] * 1/16), 
            imagedata.data[i+2] + (255/numColors.value)*(bayer4x4[x % 4][y % 4] * 1/16), 
        ]
        var nurColor = [
            imagedata.data[i+0],
            imagedata.data[i+1], 
            imagedata.data[i+2], 
        ] 
        getColor = getClosestColor(curColor, colors)

        imagedata.data[i+0] = getColor[0]
        imagedata.data[i+1] = getColor[1]
        imagedata.data[i+2] = getColor[2]
    }
    ctx.putImageData(imagedata,0,0)
};

function generatePalette(){
    p1.innerHTML = ""
    colors = []
    colorsRGB = []

    var baseL = lerp(.2,.7,Math.random())
    var changeL = lerp(.2,1-baseL,Math.random())
    var baseC = lerp(.05, .2, Math.random())
    var changeC = lerp(.075,.2-baseC, Math.random())
    var baseH = 2*Math.PI*Math.random()
    var changeH = lerp(.3, 1, Math.random())

    if(mode.value == "achromatic"){
        baseC = 0
        changeC = 0
    }

    for(let i = 0; i < numColors.value; i++){
        var wheelItr = i / (numColors.value -1)
        var offsetH = wheelItr * changeH * 2 * Math.PI + (Math.PI / 4)

        if(mode.value == "monochrome") { offsetH *= 0 }
        if(mode.value == "complementary") { offsetH *= .25 }
        if(mode.value == "analgous") { offsetH *= 1/3 }
        if(mode.value == "triadic") { offsetH *= 2/3 }
        if(mode.value == "tetradic") { offsetH *= .75 }

        
        var L = baseL + wheelItr * changeL
        var H = baseH + offsetH
        if (mode.value != "monochrome"){
            var C = baseC
        }
        else{
            var C = baseC + wheelItr * changeC
        }
        var colWrap = document.createElement("div")
        colWrap.classList.add("color")
        var colName = document.createElement("p")
        var curCol = document.createElement("canvas");
        curCol.id = "color"+i
        curCol.width = "300"
        curCol.height = "20"
        const ctx = curCol.getContext("2d", {willReadFrequently: true})
        ctx.fillStyle = "oklch("+L+", "+C+", "+H+"rad)"
        ctx.fillRect(0, 0, curCol.width, curCol.height)
        colName.innerHTML = "#"+rgbToHex(ctx.getImageData(0, 0, 1, 1).data)
        
        colors.push(rgbToHex(ctx.getImageData(0, 0, 1, 1).data))
        colorsRGB.push(ctx.getImageData(0, 0, 1, 1).data)
        colWrap.appendChild(curCol)
        colWrap.appendChild(colName)
        p1.appendChild(colWrap)
    }
    console.log(colorsRGB)
    getPaletteName(colors)
    quantize(colorsRGB)
}

