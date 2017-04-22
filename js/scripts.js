window.onload = () => {

  const defaultOptions = {
    pointDiameter: 11,
    pointColor: "red",
    pointColorDragged: "pink",
    font: "10px Arial",
    parallelogramColor: "blue",
    circleColor: "yellow"
  };
  
  class CanvasApp {
    constructor(elem) {
      this.canvas = elem;
      this.ctx = this.canvas.getContext('2d');
      this.points = [];

      this.setCanvasSize();
      this.listen();
    }

    redrawEverything() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (this.points.length >= 3) {
        this.points = this.points.slice(0, 3);
        this.points.map(point => new Point({x: point.x, y: point.y, ctx: this.ctx}, point.isDragged));
        this.drawParallelogram();
      }
    }

    setCanvasSize() {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;

      this.redrawEverything();
    }

    listen() {
      window.addEventListener('resize', this.setCanvasSize.bind(this), true);
      this.canvas.addEventListener('mousedown', this.handleClick.bind(this), false);
      this.canvas.addEventListener('mousemove', this.mousemove.bind(this), false);
      this.canvas.addEventListener('mouseup', this.mouseup.bind(this), false);
    };

    mouseup(e) {
      if (this.dragged) {
        this.points.map(point => point.isDragged = false);
        this.dragged = null;
        this.redrawEverything();
      }
    }

    mousemove(e) {
      if (this.dragged) {
        this.dragged.x += e.movementX;
        this.dragged.y += e.movementY;
        this.redrawEverything();
      }
    }

    handleClick(e) {
      const x = e.clientX, y = e.clientY;
      if (this.points.length >= 3) {
        const pointRadius = defaultOptions.pointDiameter/2;
        this.points.map(point => {
          if (x > point.x - pointRadius && x < point.x + pointRadius
            && y > point.y - pointRadius && y < point.y + pointRadius) {
              this.dragged = point;
              point.isDragged = true;
            }
          })
        }
        else {
          this.addPoint({x, y});
        }
      }

      addPoint({x, y}) {
        this.points.push({x, y});
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.points.map(point => {
          new Point({
            x: point.x,
            y: point.y,
            ctx: this.ctx
          });
        })

        this.drawParallelogram();
      }

      drawParallelogram() {
        this.parallelogram = new Parallelogram(this.points, this.ctx);
        if (this.parallelogram.area && this.parallelogram.centreOfMass)
        this.drawCircle(this.parallelogram.area, this.parallelogram.centreOfMass);
      }

      drawCircle(area, centre) {
        new Circle({area, centre}, this.ctx);
      }

      clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.points.length = 0;
      }

    }

    class Circle {
      constructor({area, centre}, ctx) {
        this.x = centre.x;
        this.y = centre.y;
        this.area = area;
        this.ctx = ctx;

        this.draw()
      }

      draw() {
        const r = Math.round(Math.sqrt(this.area/Math.PI))

        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, r, 0, 2*Math.PI, false);
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = defaultOptions.circleColor;
        this.ctx.stroke();

      }
    }

    class Point {
      constructor({x, y, ctx}, isDragged = false) {
        const r = defaultOptions.pointDiameter/2;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2*Math.PI, false);
        ctx.lineWidth = 1;
        ctx.strokeStyle = isDragged ? defaultOptions.pointColorDragged : defaultOptions.pointColor;
        ctx.stroke();

        ctx.font = defaultOptions.font;
        ctx.fillText(`x: ${x}`, x - 10, y + 20);
        ctx.fillText(`y: ${y}`, x - 10, y + 30);
      }
    }

    class Parallelogram {
      constructor(points = [], ctx) {
        let {x, y} = this.calculateFourthPoint(points);
        if (x && y) {
          this.ctx = ctx;
          points.push({x, y});
          this.points = points;
          this.area = this.getArea(points);
          this.centreOfMass = this.getCentreOfMass(points);
          this.draw([...points], ctx);
        }
      }

      getArea(points) {
        let AB = this.getVector(points[0], points[1]),
        AC = this.getVector(points[0], points[2]);
        return Math.abs((AB.x*AC.y) - (AB.y*AC.x));
      }

      getCentreOfMass() {
        let x = 0,
        y = 0;
        for (let i = 0; i < 4; i++) {
          x += this.points[i].x/4;
          y += this.points[i].y/4;
        }

        return {x: Math.round(x), y: Math.round(y)}
      }

      draw(arr, ctx) {
        ctx.beginPath();
        ctx.moveTo(arr[0].x, arr[0].y);
        arr.map(i => {
          ctx.lineTo(i.x, i.y);
        })
        ctx.closePath()
        ctx.strokeStyle = defaultOptions.parallelogramColor;
        ctx.stroke();

        ctx.font = defaultOptions.font;
        ctx.fillText(`x: ${this.centreOfMass.x}`, this.centreOfMass.x - 10, this.centreOfMass.y + 20);
        ctx.fillText(`y: ${this.centreOfMass.y}`, this.centreOfMass.x - 10, this.centreOfMass.y + 30);
        ctx.fillText(`area: ${this.area}`, this.centreOfMass.x - 10, this.centreOfMass.y + 40);
      }

      calculateFourthPoint(points) {
        let A = points[0],
        B = points[1],
        C = points[2];

        if (B.x === A.x && B.x === C.x) return {x: null, y: null};

        if (B.x === A.x || C.x === B.x) {
          points.push(points.shift());
          return this.calculateFourthPoint(points);
        }

        let AB = this.getSlopeAndIntercept(A, B);
        let BC = this.getSlopeAndIntercept(B, C);


        let m = C.y - AB.k*C.x,
        n = A.y - BC.k*A.x

        let {x, y} = this.getPointCoords({k: AB.k, b: m}, {k: BC.k, b: n});

        return {x, y}

      }

      getVector(pointA, pointB) {
        return {x: pointB.x - pointA.x, y: pointB.y - pointA.y}
      }

      getSlopeAndIntercept(pointA, pointB) {
        // pointA.y = k * pointA.x + b
        // pointB.y = k * pointB.x + b

        let k = pointB.x === pointA.x ? 0 : (pointB.y - pointA.y)/(pointB.x - pointA.x);
        let b = pointB.y - k*pointB.x;
        return {k, b}
      }

      getPointCoords(f1, f2) {
        let x = f1.k === f2.k ? 0 : (f2.b - f1.b)/(f1.k - f2.k);
        let y = (f1.k*x) + f1.b;
        return {x, y}
      }
    }

    let App = new CanvasApp(document.getElementById('shapes'));
    document.getElementById('clear').addEventListener('click', function() {
      App.clear()
    }, false);

    let popup = document.getElementById('popup');
    document.getElementById('about').addEventListener('click', function() {
      popup.classList.add('shown');
    }, false);
    popup.querySelector('.close').addEventListener('click', function() {
      popup.classList.remove('shown');
    }, false);

  }
