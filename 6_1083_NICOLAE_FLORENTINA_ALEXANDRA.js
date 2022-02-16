"use strict"

const app={
    //vom retine ce unealta folosim
    tool:"select",

    //si ce culori si intensitate contur
    colorBkg: null,
    colorStroke: null,
    strokeValue: 0,

    //retinem daca utilizatorul tine apasat mouse-ul pt a desena si pozitia mouse-ului
    deseneaza:false,
    mouseX:null,
    mouseY:null,

    svg:null,
    svgns:"http://www.w3.org/2000/svg",

    obiecte:[], //un vector in care stocam obiectele create pe canvas - exceptie pt creion
    count:0 //cate obiecte sunt - nu era nevoie de el, dar l-am folosit din obisnuinta
}

app.load=function(){
    app.svg=document.getElementById("artboard");

    //proprietatile default
    app.colorBkg=document.getElementById("clrFill").value;
    app.colorStroke=document.getElementById("clrStroke").value;
    app.strokeValue=document.getElementById("strokeValue").value;

    //proprietatile cand sunt schimbate
    document.getElementById("clrFill").addEventListener('change',function(e){
        app.colorBkg=e.target.value;
    })
    document.getElementById("clrStroke").addEventListener('change',function(e){
        app.colorStroke=e.target.value;
    })
    document.getElementById("strokeValue").addEventListener('change',function(e){
        app.strokeValue=e.target.value;
    })

    //console.log(app.colorBkg+" "+app.colorStroke+" "+app.strokeValue);

    //pt butoanele din tools, aflam ce unealta folosim
    document.getElementById("btnSelectie").addEventListener("click", function(){
        app.tool="select";
    });

    document.getElementById("btnCreion").addEventListener("click", function(){
        app.tool="creion";
    });

    document.getElementById("btnLinie").addEventListener("click", function(){
        app.tool="linie";
    });

    document.getElementById("btnDreptunghi").addEventListener("click", function(){
        app.tool="rect";
    });

    document.getElementById("btnElipsa").addEventListener("click", function(){
        app.tool="elipsa";
    });

    //console.log(app.tool);

    //desenare pe plansa
    //evenimentul se declanseaza doar unde este plansa creata in html
    document.getElementById("svgArtboard").addEventListener("mousedown",function(e){
        //console.log("mouse apasat");
        //retinem ca mouse-ul este apasat si pozitia la care e apasat
        app.deseneaza=true;
        app.mouseX=e.offsetX;
        app.mouseY=e.offsetY;
    });
    document.getElementById("svgArtboard").addEventListener("mousemove",function(e){
        //vom folosi evenimentul doar pentru creion, se va desena pe masura ce mutam mouse-ul --probabil nu este cea mai buna varianta
        if(app.deseneaza&&app.tool==="creion"){
            app.draw(e.offsetX, e.offsetY); //noile coord ale mouse-ului
            app.mouseX = e.offsetX;
            app.mouseY = e.offsetY;
        }
    });
    document.getElementById("svgArtboard").addEventListener("mouseup",function(e){
        if(app.deseneaza){
            app.draw(e.offsetX, e.offsetY);
            app.mouseX = null;
            app.mouseY = null;
            app.deseneaza=false;
        }
    });

    //evenimente din meniu
    //new file
    document.getElementById("mn_newFile").addEventListener('click',function(e){
        //se va sterge element cu element
        while(app.count>0){
            let elem = document.getElementById(app.obiecte[app.count-1].id);   
            app.svg.removeChild(elem);
            app.count--;
        }
        app.obiecte=[];
    })
    //save svg
    document.getElementById("mn_saveSvg").addEventListener('click',function(e){
        var svgData = app.svg.outerHTML;
        var svgBlob = new Blob([svgData], {type:"image/svg+xml;charset=utf-8"});
        var svgUrl = URL.createObjectURL(svgBlob);

        const link=document.createElement("a");
        link.href = svgUrl;
        link.download="desen.svg";
        
        link.click();
    })
    //save raster
    document.getElementById("mn_saveRaster").addEventListener('click',function(e){
        var svgData = new XMLSerializer().serializeToString( app.svg );

        var canvas = document.createElement( "canvas" );
        var ctx = canvas.getContext( "2d" );
        var svgSize = app.svg.getBoundingClientRect();
        canvas.width = svgSize.width;
        canvas.height = svgSize.height;

        var img = document.createElement( "img" );
        img.setAttribute( "src", "data:image/svg+xml;base64," + btoa( svgData ));

        img.onload = function() {
            ctx.drawImage( img, 0, 0 );

            const link=document.createElement("a");
            link.download="desen";
            link.href=canvas.toDataURL("image/png");
            link.click();
        }
    })

    //undo
    //nu e valabil pentru creion si nici pentru stergere, mutare sau schimbare element, 
    //e valabil doar pt adaugarea de element
    document.getElementById("mn_undo").addEventListener("click",function(){
        //anularea ultimelor n operatii echiv cu stergerea ultimei forme create
        if(app.count>0){
            //stergere element de pe artboard:
            let elem = document.getElementById(app.obiecte[app.count-1].id); 
            console.log(elem);  
            app.svg.removeChild(elem);

            //cu libraria d3:
            //d3.select("#"+app.obiecte[app.count-1].id).remove();
            
            //stergere din vector
            app.obiecte[app.count-1]=null;
            app.count--;
        }
    })
}

app.draw = function(x,y){
    //desenare linie, dreptunghi, elipsa
    
    //app.mouseX si Y vor fi cele de start cand se va ajunge in aceasta functie
    const x1=app.mouseX;
    const y1=app.mouseY;
    const x2=x;
    const y2=y;

    if((app.tool==="linie"||app.tool==="creion")&&(x1!==x2||y1!==y2)){
        //la creion se vor desena mai multe linii (asemanatoare unor puncte) pe masura ce se muta mouse-ul (mousemove)
        //la linie se va desena o linie dreapta din momentul in care e tinut apasat mouse-ul (mousedown), pana in punctul in care e eliberat (mouseup)
        const linie = document.createElementNS(app.svgns, 'line');
        linie.setAttribute('x1', x1);
        linie.setAttribute('y1', y1);
        linie.setAttribute('x2', x2);
        linie.setAttribute('y2', y2);
        linie.setAttribute('id',"obj"+app.count);
        
        //setam proprietatile
        linie.setAttribute('fill',app.colorBkg);
        linie.setAttribute('stroke',app.colorStroke);
        linie.style["stroke-width"]=app.strokeValue;

        //stocam obiectele intr-un vector pt a le putea sterge mai tarziu. Pt creion nu este valabil pt ca e facut din mai multe linii(puncte)
        if(app.tool==="linie"){
            app.obiecte[app.count]=linie;
            console.log(app.obiecte[app.count]);
            app.count++;

            linie.addEventListener("click", app.select);
            //linie.addEventListener("dblclick",app.deleteObj);
        }

        app.svg.appendChild(linie);
    }
    if(app.tool==="rect"&&(x1!==x2||y1!==y2)){
        //desenam dreptunghi
        const rect = document.createElementNS(app.svgns, 'rect');

        //calculam coordonatele pe baza coord stiute (date de mouse)
        let x,y;
        let w,h;
        if(x2>x1){ 
            w=x2-x1;x=x1;
        }else{
            w=x1-x2;x=x2;
        }

        if(y2>y1){ 
            h=y2-y1;y=y1;
        }else{
            h=y1-y2;y=y2;
        }

        rect.setAttribute('x', x);
        rect.setAttribute('y', y);
        rect.setAttribute('width', w);
        rect.setAttribute('height', h);
        rect.setAttribute('id',"obj"+app.count);
        rect.setAttribute('fill',app.colorBkg);
        rect.setAttribute('stroke',app.colorStroke);

        // rect.style.fill=app.colorBkg;
        // rect.style.stroke=app.colorStroke;
        rect.style["stroke-width"]=app.strokeValue;

        rect.addEventListener("click",app.select);
        //rect.addEventListener("dblclick",app.deleteObj);

        app.obiecte[app.count]=rect;
        console.log(app.obiecte[app.count]);
        app.count++;
        
        app.svg.appendChild(rect);
    }
    if(app.tool==="elipsa"&&(x1!==x2||y1!==y2)){
        //desenam elipsa
        const elipsa = document.createElementNS(app.svgns, 'ellipse');

        //calculam coordonatele pe baza coord stiute (date de mouse)
        let cx,cy,rx,ry;
        if(x2>x1){
            cx=(x2-x1)/2+x1;
            rx=(x2-x1)/2;
        }
        else{
            cx=(x1-x2)/2+x2;
            rx=(x1-x2)/2;
        }
        if(y2>y1){
            cy=(y2-y1)/2+y1;
            ry=(y2-y1)/2;
        }
        else{
            cy=(y1-y2)/2+y2;
            ry=(y1-y2)/2;
        }

        elipsa.setAttribute('cx', cx);
        elipsa.setAttribute('cy', cy);
        elipsa.setAttribute('rx', rx);
        elipsa.setAttribute('ry', ry);
        elipsa.setAttribute('id',"obj"+app.count);
        elipsa.setAttribute('fill',app.colorBkg);
        elipsa.setAttribute('stroke',app.colorStroke);

        //elipsa.style.fill=app.colorBkg;
        //elipsa.style.stroke=app.colorStroke;
        elipsa.style["stroke-width"]=app.strokeValue;
        

        app.obiecte[app.count]=elipsa;
        console.log(app.obiecte[app.count]);
        app.count++;

        elipsa.addEventListener("click", app.select);
        //elipsa.addEventListener("dblclick",app.deleteObj);

        app.svg.appendChild(elipsa);
    }
}

app.select=function(e){
    //evenimente de move si modificare
    if(app.tool==="select"){
        console.log(e.target.id);
        let elem=document.getElementById(e.target.id);

        // let a=document.getElementById("clrFill");
        // a.value=elem.getAttribute('fill');
        // app.colorBkg=a.value;

        // let b=document.getElementById("clrStroke");
        // b.value=elem.getAttribute('stroke');
        // app.colorStroke=b.value;
        
        // let c=document.getElementById("strokeValue");
        // c.value=elem.style.strokeWidth;
        // app.strokeValue=c.value;

        // proprietatile elementului se vor modifica in cele alese ultima data - ev nerevocabil
        elem.style.fill=app.colorBkg;
        elem.style.stroke=app.colorStroke;
        elem.style["stroke-width"]=app.strokeValue;

        //la dubluclick se va sterge elementul de pe plansa. NU poate fi recuperat
        elem.addEventListener("dblclick",app.deleteObj);

        //move
        document.addEventListener("keydown",function(ev){
            //cu translate se va muta fata de cat era initial cu 10px.
            //se ia elementul, se afla forma si se schimba atributele in functie de forma si de butoanele apasate 
            console.log(elem.tagName);
            if(ev.keyCode===37){
                //stanga
                //elem.setAttribute("transform","translate(-10)");
                if(elem.tagName==='rect')
                    elem.setAttribute('x',elem.getAttribute('x')-5);
                else if(elem.tagName==='ellipse')
                    elem.setAttribute('cx',elem.getAttribute('cx')-5);
                    else if(elem.tagName==='line'){
                        elem.setAttribute('x1',elem.getAttribute('x1')-5);
                        elem.setAttribute('x2',elem.getAttribute('x2')-5);
                    }
            }
            else if(ev.keyCode==39){
                //dreapta
                //elem.setAttribute("transform","translate(10)")
                if(elem.tagName==='rect'){
                    //console.log(elem.getAttribute('x'));
                    //console.log(elem.getAttribute('x')+5);
                    let x=parseInt(elem.getAttribute('x'))+5;
                    elem.setAttribute('x',x);
                }
                else if(elem.tagName==='ellipse'){
                    let cx=parseInt(elem.getAttribute('cx'))+5;
                    elem.setAttribute('cx',cx);
                }
                    else if(elem.tagName==='line'){
                        let x1=parseInt(elem.getAttribute('x1'))+5;
                        let x2=parseInt(elem.getAttribute('x2'))+5;
                        elem.setAttribute('x1',x1);
                        elem.setAttribute('x2',x2);
                    }
            }
            else if(ev.keyCode==38){
                //sus
                //elem.setAttribute("transform","translate(0,-10)")
                if(elem.tagName==='rect')
                    elem.setAttribute('y',elem.getAttribute('y')-5);
                else if(elem.tagName==='ellipse')
                    elem.setAttribute('cy',elem.getAttribute('cy')-5);
                    else if(elem.tagName==='line'){
                        elem.setAttribute('y1',elem.getAttribute('y1')-5);
                        elem.setAttribute('y2',elem.getAttribute('y2')-5);
                    }
            }
            else if(ev.keyCode==40){
                //jos
                //elem.setAttribute("transform","translate(0,10)")
                if(elem.tagName==='rect'){
                    let y=parseInt(elem.getAttribute('y'))+5;
                    elem.setAttribute('y',y);
                }
                else if(elem.tagName==='ellipse'){
                    let cy=parseInt(elem.getAttribute('cy'))+5;
                    elem.setAttribute('cy',cy);
                }
                    else if(elem.tagName==='line'){
                        let y1=parseInt(elem.getAttribute('y1'))+5;
                        let y2=parseInt(elem.getAttribute('y2'))+5;
                        elem.setAttribute('y1',y1);
                        elem.setAttribute('y2',y2);
                    }
            }
        });
    }
}

app.deleteObj=function(e){
    if(app.count>0){
        //stergere element de pe artboard:
        let elem = document.getElementById(e.target.id); 
        app.svg.removeChild(elem);
        
        //console.log(app.obiecte);
        //stergere din vector
        let i=app.obiecte.indexOf(elem);
        //console.log(i);
        if (i>=0) {
            app.obiecte.splice(i, 1);
        }          
        app.count--;
        //console.log(app.obiecte);
    }
}