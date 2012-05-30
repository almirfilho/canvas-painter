$(document).ready( function(){

	// inicializando -------------------------------------------
	
	var canvas = $('#canvas').get(0);
	var context = canvas.getContext( '2d' );

	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	// variaveis de estado -------------------------------------

	var drawing = false;
	var flag = false;
	var canvasPoints = Array();
	var objects = Array();
	var selectedObj = null;
	var zoomLevel = 100;
	var keyPress = null;
	var pNum = 0;
	var focusedField = false;
	
	var p = new Point( 100, 100 );
	var k = 30;
	
	window.addEventListener("MozOrientation", function(e){
		
		x = (parseInt(e.x * 100)/100) * k;
		y = (parseInt(e.y * 100)/100) * k;
		
		p.modify( p.x+x, p.y+y );
		renderCanvas();
		
	}, true);
	
	$('#menu').css( 'height', canvas.height - 22 );
	
	$('input[type="text"]').focus( function(){
		
		focusedField = true;
		
	}).blur( function(){
		
		focusedField = false;
	});
	
	$('.tools .button').click( function(){

		$('.tools .button').removeClass( 'selected' );
		$(this).addClass( 'selected' );
		bindTool( $(this).attr( 'ref' ) );
	});
	
	$(document).keypress( function( e ){
		
		if( focusedField )
			return;
		
		tool = null;

		switch( e.which ){
			
			case 115: // S
				tool = 'selection';
				break;
				
			case 61: // +
				tool = 'zoomIn';
				break;
				
			case 45: // -
				tool = 'zoomOut';
				break;
				
			case 32: // espaco
				tool = 'pan';
				break;
				
			case 112: // P
				tool = 'point';
				break;
				
			case 108: // L
				tool = 'line';
				break;
				
			case 111: // O
				tool = 'polygon';
				break;
				
			case 98: // B
				tool = 'bezierCurve';
				break;
				
			case 113: // Q
				tool = 'quadraticCurve';
				break;
				
			case 100: // D
				tool = 'freeHand';
				break;
				
			case 116: // T
				tool = 'text';
				break;
				
			case 114: // R
				tool = 'rotation';
				break;
				
			case 107: // K
				tool = 'scale';
				break;
				
			case 101: // E
				tool = 'mirror';
				break;
				
			case 104: // H
				tool = 'quickHull';
				break;
				
			case 106: // H
				tool = 'jarvis';
				break;
				
			// case 116: // T
			// 	tool = 'triangularization';
			// 	break;
		}
		
		if( tool != null ){
			
			$('.tools .button[ref="'+tool+'"]').click();
		}
		
	}).keydown( function( e ){
		
		keyPress = e.keyCode;
		
	}).keyup( function( e ){
		
		keyPress = null;
	});
	
	function bindTool( value ){
		
		drawing = focusedField = false;
		
		if( value != 'rotation' && value != 'scale' && value != 'mirror' )
			unselectAll();
		
		$('.options').hide();
		$('#canvas').unbind();
		
		switch( value ){
			
			case 'selection':
				bindSelectionTool();
				break;
				
			case 'quickHull':
				quickHull();
				break;
				
			case 'jarvis':
				jarvis();
				break;
			
			case 'zoomIn':
				bindZoomTool( 'in' );
				break;
				
			case 'zoomOut':
				bindZoomTool( 'out' );
				break;
				
			case 'pan':
				bindPanTool();
				break;
						
			case 'rotation':
				bindRotationTool();
				break;
				
			case 'scale':
				bindScaleTool();
				break;
				
			case 'mirror':
				bindMirrorTool();
				break;
				
			case 'point':
				bindPointTool();
				break;
				
			case 'line':
				bindLineTool();
				break;
				
			case 'polygon':
				bindPolygonTool();
				break;

			case 'freeHand':
				bindFreeHandTool();
				break;
				
			case 'bezierCurve':
				bindBezierCurveTool();
				break;
				
			case 'quadraticCurve':
				bindQuadraticCurveTool();
				break;
				
			case 'text':
				bindTextTool();
				break;
				
			case 'triangularization':
				triangularization();
				break;
				
			case 'randomPoints':
				bindRandomPoints();
				break;
		}
		
		$('#canvas').mousemove( function( e ){

			$('#mousePosition').html( '<span>X:</span> ' + x(e) + ' <span>Y:</span> ' + y(e) );
		});
	}
	
	function bindSelectionTool(){

		var iniX = null;
		var iniY = null;
		var previousSelected = null;
		
		$('#canvas').click( function( e ){
	
			if( keyPress == 16 && selectedObj != null )
				previousSelected = selectedObj;
			
			unselectAll();
			
			// selecionando o ponto clicado (se houver)
			for( i = 0; i < objects.length; i++ ){

				if( objects[i].pick( x(e), y(e) ) ){
					
					objects[i].select();
					selectedObj = objects[i];
					
					if( objects[i].type == 'line' && objects[i] == previousSelected ){
						
						if( objects[i].parent != null ){
							
							selectedObj = objects[i].parent;
							objects[i].parent.select();
						}
					}
					
					return;
				}
			}
			
		}).mousedown( function( e ){

			if( selectedObj != null ){
					
				px = x(e);
				py = y(e);

				if( selectedObj.pick( px, py ) ){

					drawing = true;
					iniX = px;
					iniY = py;
				}
			}
			
		}).mouseup( function( e ){

			drawing = false;
			iniX = iniY = previousSelected = null;

		}).mousemove( function( e ){

			if( selectedObj != null && drawing ){
				
				px = x(e);
				py = y(e);
				
				if( selectedObj.type == 'point' )
					selectedObj.modify( px, py );
					
				else {
					
					selectedObj.modifyPosition( px - iniX, py - iniY );
					iniX = px;
					iniY = py;
				}
				
				renderCanvas();
			}
		});
	}

	function bindZoomTool( type ){
		
		var scale = 1.3;
		var level = 33;
		
		if( type == 'in' ){
			
			$('#canvas').click( function( e ){	
				
				context.scale( scale, scale );
				context.translate( (canvas.width/(scale*scale) - x(e))*level/zoomLevel, (canvas.height/(scale*scale) - y(e))*level/zoomLevel );
				zoomLevel += level;
				renderCanvas( true );
			});
			
		} else if( type == 'out' ){
			
			$('#canvas').click( function( e ){
			
				context.scale( 1/scale, 1/scale );
				context.translate( (canvas.width/(scale*scale) - x(e))*level/zoomLevel, (canvas.height/(scale*scale) - y(e))*level/zoomLevel );
				zoomLevel -= level;
				renderCanvas( true );
			});
		}
	}
	
	function bindPanTool(){
		
		startX = null;
		startY = null;
		currentX = null;
		currentY = null;
		
		$('#canvas').mousedown( function( e ){
			
			context.save();
			startX = currentX = x(e);
			startY = currentY = y(e);
			drawing = true;
			
		}).mouseup( function( e ){
			
			dx = x(e) - startX;
			dy = y(e) - startY;

			for( i = 0; i < canvasPoints.length; i++ )
				canvasPoints[i].modify( canvasPoints[i].x + dx, canvasPoints[i].y + dy );
			
			for( i = 0; i < objects.length; i++ )
				if( objects[i].type == 'text' )
					objects[i].modifyPosition( dx, dy );
			
			context.restore();
			renderCanvas();
			startX = startY = currentX = currentY = null;
			drawing = false;
			
		}).mousemove( function( e ){
			
			if( drawing ){
				
				px = x(e);
				py = y(e);
				
				context.translate( px - currentX, py - currentY );
				renderCanvas( true );
				
				currentX = px;
				currentY = py;
			}
		});
	}
	
	function bindRotationTool(){
		
		if( selectedObj == null ){
			
			alert( 'Selecione um objeto primeiro.' );
			$('#tool').val( 'selection' ).change();
			
		} else if( selectedObj.type == 'point') {
			
			alert( 'Selecione um objeto diferente de Ponto.' );
			$('#tool').val( 'selection' ).change();
			
		} else if( selectedObj.type == 'text' ){

				alert( 'Selecione um objeto diferente de Texto.' );
				$('#tool').val( 'selection' ).change();

		} else {
			
			selectedObj.selectBoundingBox();
			
			var startX = null;
			var startY = null;

			$('#canvas').mousedown( function( e ){

				if( !drawing ){
					
					startY = y(e);
					drawing = true;
				}

			}).mouseup( function( e ){
				
				if( selectedObj != null && drawing ){
					
					selectedObj.rotate( y(e) - startY );
					renderCanvas();
				
					drawing = false;
					startY = null;
				}

			}).mousemove( function( e ){

				if( selectedObj != null && drawing ){
				
					py = y(e);
					objCenterX = selectedObj.x + (selectedObj.width / 2);
					objCenterY = selectedObj.y + (selectedObj.height / 2);
					
					context.save();
					renderCanvas();
					
					context.translate( objCenterX, objCenterY );
					context.rotate( (py - startY) / selectedObj.height * Math.PI );
					context.translate( -objCenterX, -objCenterY );
					
					selectedObj.render();
					context.restore();
				}
			});
		}
	}
	
	function bindScaleTool(){

		if( selectedObj == null ){
			
			alert( 'Selecione um objeto primeiro.' );
			$('#tool').val( 'selection' ).change();
			
		} else if( selectedObj.type == 'point' ){
			
			alert( 'Selecione um objeto diferente de Ponto.' );
			$('#tool').val( 'selection' ).change();
			
		} else if( selectedObj.type == 'text' ){

				alert( 'Selecione um objeto diferente de Texto.' );
				$('#tool').val( 'selection' ).change();

		} else {
			
			selectedObj.selectBoundingBox();
			
			var startX = null;
			var currentX = null;
			var scale = 1;
			
			$('#canvas').mousedown( function( e ){

				if( !drawing ){
					
					startX = currentX = x(e);
					drawing = true;
				}

			}).mouseup( function( e ){
				
				if( selectedObj != null && drawing ){
					
					selectedObj.scale( x(e) - startX );
					renderCanvas();
				
					drawing = false;
					scale = 1;
					startX = currentX = null;
				}

			}).mousemove( function( e ){

				if( selectedObj != null && drawing ){
				
					objCenterX = selectedObj.x + (selectedObj.width / 2);
					objCenterY = selectedObj.y + (selectedObj.height / 2);
					px = x(e);
					dx = px - currentX;
					scale += dx * 0.05;
					currentX = px;
					
					context.save();
					renderCanvas();
					
					context.translate( objCenterX, objCenterY );
					context.scale( scale, scale );
					context.translate( -objCenterX, -objCenterY );
					
					selectedObj.render();
					context.restore();
				}
			});
		}
	}
	
	function bindMirrorTool(){
		
		if( selectedObj == null ){
			
			alert( 'Selecione um objeto primeiro.' );
			$('#tool').val( 'selection' ).change();
			
		} else if( selectedObj.type == 'point' ){
			
			alert( 'Selecione um objeto diferente de Ponto.' );
			$('#tool').val( 'selection' ).change();
			
		} else if( selectedObj.type == 'text' ){

				alert( 'Selecione um objeto diferente de Texto.' );
				$('#tool').val( 'selection' ).change();

		} else {
			
			var point = null;
			var line = null;
			var oldPoint = null;

			$('#canvas').mousedown( function( e ){

				point = new Point( x(e), y(e) );
				drawing = true;

			}).mouseup( function( e ){

				selectedObj.mirror( line );
				line.remove( true );
				renderCanvas();
				drawing = false;
				line = point = oldPoint = null;

			}).mousemove( function( e ){

				if( drawing ){

					px = x(e);
					py = y(e);

					if( line == null ){

						oldPoint = new Point( px, py );
						line = new Line( point, oldPoint );

					} else {

						oldPoint.modify( px, py );
						renderCanvas();
					}
				}
			});
		}
	}
	
	function bindPointTool(){

		$('#canvas').click( function( e ){

			new Point( x(e), y(e) );
		});
	}
	
	function bindLineTool(){
		
		var point = null;
		var line = null;
		var oldPoint = null;
		
		$('#canvas').mousedown( function( e ){
			
			point = new Point( x(e), y(e) );
			drawing = true;
			
		}).mouseup( function( e ){
			
			px = x(e);
			py = y(e);
			
			if( point.pick( px, py ) )
				point.remove();
				
			drawing = false;
			line = point = oldPoint = null;
			
		}).mousemove( function( e ){
			
			if( drawing ){
				
				px = x(e);
				py = y(e);
				
				if( line == null ){
					
					oldPoint = new Point( px, py );
					line = new Line( point, oldPoint );
					
				} else {
					
					oldPoint.modify( px, py );
					renderCanvas();
				}
			}
		});
	}
	
	function bindPolygonTool(){
		
		var points = Array();
		var lines = Array();
		var lastPoint = null;
		var currentPoint = null;
		var currentLine = null;
		
		$('#canvas').click( function( e ){

			if( !drawing ){
				
				lastPoint = new Point( x(e), y(e) );
				points.push( lastPoint );
				drawing = true;

			} else {
				
				px = x(e);
				py = y(e);
				
				if( points[0].pick( px, py ) ){

					currentPoint.remove();
					currentLine.remove();
					lines.push( new Line( lastPoint, points[0] ) );
					polygon = new Polygon( points, lines );
					renderCanvas();
					drawing = false;
					points = Array();
					lines = Array();
					lastPoint = currentPoint = currentLine = null;
				
				} else {
					
					points.push( currentPoint );
					lines.push( currentLine );
					lastPoint = currentPoint;
					currentLine = null;
				}
			}
			
		}).mousemove( function( e ){
			
			if( drawing ){
				
				px = x(e);
				py = y(e);
				
				if( currentLine == null ){
					
					currentPoint = new Point( px, py );
					currentLine = new Line( lastPoint, currentPoint );
					
				} else {
					
					currentPoint.modify( px, py );
					renderCanvas();
				}
			}
		});
	}
	
	function bindFreeHandTool(){
		
		$('#canvas').click( function( e ){
			
			if( !drawing ){
				
				context.beginPath();
				context.moveTo( x(e), y(e) );
				drawing = true;
				
			} else {
				
				drawing = false;
			}
			
		}).mousemove( function( e ){
			
			if( drawing ){
				
				context.lineTo( x(e), y(e) );
				context.stroke();
			}
		});
	}
	
	function bindBezierCurveTool(){
		
		var point = null;
		var curve = null;
		var oldPoint = null;
		
		$('#canvas').mousedown( function( e ){
			
			point = new Point( x(e), y(e) );
			drawing = true;
			
		}).mouseup( function( e ){
			
			px = x(e);
			py = y(e);
			
			if( point.pick( px, py ) )
				point.remove();
				
			drawing = false;
			curve = null;
			point = null;
			oldPoint = null;
			
		}).mousemove( function( e ){
			
			if( drawing ){
				
				px = x(e);
				py = y(e);
				
				if( curve == null ){
					
					oldPoint = new Point( px, py );
					curve = new BezierCurve( point, oldPoint );
					
				} else {
					
					oldPoint.modify( px, py );
					curve.updateControl();
					renderCanvas();
				}
			}
		});
	}
	
	function bindQuadraticCurveTool(){
		
		var point = null;
		var curve = null;
		var oldPoint = null;
		
		$('#canvas').mousedown( function( e ){
			
			point = new Point( x(e), y(e) );
			drawing = true;
			
		}).mouseup( function( e ){
			
			px = x(e);
			py = y(e);
			
			if( point.pick( px, py ) )
				point.remove();
				
			drawing = false;
			curve = null;
			point = null;
			oldPoint = null;
			
		}).mousemove( function( e ){
			
			if( drawing ){
				
				px = x(e);
				py = y(e);
				
				if( curve == null ){
					
					oldPoint = new Point( px, py );
					curve = new QuadraticCurve( point, oldPoint );
					
				} else {
					
					oldPoint.modify( px, py );
					curve.updateControl();
					renderCanvas();
				}
			}
		});
	}
	
	function bindTextTool(){
		
		$('#canvas').click( function( e ){
			new Text( x(e), y(e), $('#optionsText input:text').val(), $('#tam').val() );
		});
		
		$('#optionsText').show('slow');
	}
	
	function bindRandomPoints(){
		
		$('#optionsRandomPoints').show('slow');
		
		$('#optionsRandomPoints form').submit( function( e ){
			
			e.preventDefault();
			generatePoints( $(this).children( 'input:first' ).val() );
		});
	}
	
	function x( event ){
		
		return event.pageX - canvas.offsetLeft;
	}
	
	function y( event ){
		
		return event.pageY - canvas.offsetTop;
	}
	
	function renderCanvas( clear ){
		
		if( clear == null )
			context.clearRect( 0, 0, canvas.width, canvas.height );
	
		else if( clear == true )
			context.clearRect( -canvas.width*5, -canvas.height*5, canvas.width*10, canvas.height*10 );
		
		for( i = 0; i < objects.length; i++ )
			objects[i].render();
	}
	
	function sortObjects(){
		
		
	}
	
	function unselectAll(){
		
		selectedObj = null;
		
		for( var i = 0; i < objects.length; i++ )
			objects[i].unselect();
	}
	
	function mod( n ){
		if(n < 0)
			return n*(-1);
		return n;
	}
	
	function arrayRemove( array, element ){
		
		for( i = 0; i < array.length; i++ )
			if( array[i] == element )
				return array.splice( i, 1 );
	}
	
	function arrayHas( array, element ){
		
		for( i = 0; i < array.length; i++ )
			if( array[i] == element )
				return true;
		
		return false;
	}
	
	function debug( str ){
		
		$('#debug').html( str );
	}
	
	function generatePoints( n ){
		
		for( i = 0; i < n; i++ )
			new Point( Math.random()*canvas.width, Math.random()*canvas.height);
	}
	
	function distPontoReta( point, line ){
		
		// coeficiente angulare da reta
		m = (line.point2.y - line.point1.y) / (line.point2.x - line.point1.x);
		
		// equacao da reta
		a = -m;
		b = 1;
		c = (m * line.point1.x) - line.point1.y;
		
		return (a*point.x + b*point.y + c) / Math.sqrt( a*a + b*b );
	}
	
	function quickHull(){
		
		if( canvasPoints.length == 0 ){
			
			alert( 'Não há pontos no CANVAS!' );
			return;
		}
		
		// lista de todos os pontos do canvas
		points = canvasPoints.slice(0);
		
		// selecionando o ponto mais baixo ------------------------------------------------------
		pMinX = pMaxX = pMinY = pMaxY = points[0];
		minX = maxX = points[0].x;
		minY = maxY = points[0].y;
		
		for( i = 1; i < points.length; i++ ){
			
			if( points[i].y < minY ){
				
				pMinY = points[i];
				minY = points[i].y;
				
			} else if( points[i].y > maxY ){
				
				pMaxY = points[i];
				maxY = points[i].y;
			}
			
			if( points[i].x < minX ){
			
				pMinX = points[i];
				minX = points[i].x;
				
			} else if( points[i].x > maxX ){
				
				pMaxX = points[i];
				maxX = points[i].x;
			}
		}
		
		function q( line ){

			// alert('q '+line.point1.num+'-'+line.point2.num);
			// if( line.point1.num == 5 && line.point2.num == 4) alert('linha');
			if( line.point1.x == line.point2.x && line.point1.y == line.point2.y )
				return;
			
			// line.color = "#0055ff";
			// line.render();
			lineOrientation = line.point1.x - line.point2.x;
			maiorDistancia = 0;
			pontoDistante = null;
			
			// coletando pontos fora
			for( i = 0; i < points.length; i++ ){
				
				point = points[i];
				d = distPontoReta( point, line );

				// orientacao da reta (E -> D) pega pontos abaixo da reta
				if( lineOrientation < 0 ){
					if( d > 0 ){
						if( d > maiorDistancia ){
							
							maiorDistancia = d;
							pontoDistante = point;
						}
					}
					
				} else { // orientacao da rela (E <- D) pega pontos acima da reta
					if( d < 0 ){
						if( d*(-1) > maiorDistancia ){
							
							maiorDistancia = d*(-1);
							pontoDistante = point;
						}
					}
				}
			}
			
			if( pontoDistante != null && pontoDistante != line.point1 && pontoDistante != line.point2 ){
				
				line1 = new Line( line.point1, pontoDistante );
				// alert('l1 - p'+pontoDistante.num);
				line2 = new Line( pontoDistante, line.point2 );
				// alert('l2 - p'+pontoDistante.num);
				q( line1 );
				q( line2 );
				line.remove();
				// line.color = '#ff0000';
				// line.render();
				arrayRemove( points, pontoDistante );
				pontoDistante = null;
				renderCanvas();
			}
		}
		
		arrayRemove( points, pMinX );
		arrayRemove( points, pMaxX );
		arrayRemove( points, pMinY );
		arrayRemove( points, pMaxY );
		
		pMaxX.render();
		pMinY.render();
		pMinX.render();
		pMaxY.render();
		// alert('q1');
		q( new Line( pMinY, pMinX ) );
		// alert('q2');
		q( new Line( pMinX, pMaxY ) );
		// alert('q3');
		q( new Line( pMaxY, pMaxX ) );
		// alert('q4');
		q( new Line( pMaxX, pMinY ) );
		
	}
	
	function jarvis(){
		
		if( canvasPoints.length == 0 ){
			
			alert( 'Não há pontos no CANVAS!' );
			return;
		}
		
		// lista de todos os pontos do canvas
		points = canvasPoints.slice(0);
		
		// selecionando o ponto mais baixo 
		currentPoint = points[0];
		minY = points[0].y;
		
		for( i = 1; i < points.length; i++ ){
			
			if( points[i].y > minY ){
				
				currentPoint = points[i];
				minY = points[i].y;
			}
		}
		
		p0 = currentPoint;
		currentM = 0;
		nextM = null;
		hullPoints = Array();
		hullLines = Array();
		
		do {
			
			maiorAngulo = 0;
			nextPoint = null;
		
			// escolhendo o ponto de maior angulo
			for( i = 0; i < points.length; i++ ){
			
				m = (points[i].y - currentPoint.y) / (points[i].x - currentPoint.x);
				
				angulo = Math.atan( (m - currentM) / (1 + currentM*m) ) * 180 / Math.PI;
			
				if( angulo < 0 )
					angulo += 180;
			
				if( angulo > maiorAngulo ){
					maiorAngulo = angulo;
					nextPoint = points[i];
					nextM = m;
				}
			}
		
			hullLines.push( new Line( currentPoint, nextPoint ) );
			hullPoints.push( currentPoint );
			
			currentPoint = nextPoint;
			currentM = nextM;
			arrayRemove( points, currentPoint );
			
		} while( currentPoint != p0 );
		
		return new Polygon( hullPoints, hullLines );
	}
	
	function triangularization(){
		
		generatePoints( 10 );
		hull = jarvis();
		// new Polygon( hull );
		// debug(hull.length);
		
		// p1 = new Point( 123, 343 );
		// p2 = new Point( 234, 22 );
		// p3 = new Point( 423, 422 );
		// new Point( (p1.x+p2.x+p3.x)/3, (p1.y+p2.y+p3.y)/3 );
		
		// Line.prototype.otherPoint = function( point ){
		// 	
		// 	if( point == this.point1 )
		// 		return this.point2;
		// 	else
		// 		return this.point1;
		// }
		
		Point.prototype.connected = function( point ){
			
			for( i = 0; i < this.parents.length; i++ )
				if( this.parents[i].point1 == point && this.parents[i].point2 == point )
					return true;
			
			return false;
		}
		
		Point.prototype.free = function(){
			
			return this.parents.length == 0;
		}
		
		Line.prototype.getPoints = function(){
			
			lineOrientation = this.point1.x - this.point2.x;
			insidePoints = Array();
			
			// coletando pontos fora
			for( i = 0; i < points.length; i++ ){
				
				point = points[i];
				d = distPontoReta( point, this );

				// orientacao da reta (E -> D) pega pontos abaixo da reta
				if( lineOrientation < 0 ){
					if( d > 0 ){
						
						insidePoints.push( point );
						arrayRemove( points, point );
					}
					
				} else { // orientacao da rela (E <- D) pega pontos acima da reta
					if( d < 0 ){
							
						insidePoints.push( point );
						arrayRemove( points, point );
					}
				}
			}
			
			return insidePoints;
		}
		
		ipoints = points.slice(0);
		p = hull.points[0];
		lines = Array();
		p.color = '#ff0000';
		p.render();
		
		for( var hi = 2; hi < hull.points.length; hi++ ){
			// alert(hull.points[hi].num);
			if( !p.connected( hull.points[hi] ) ){
				
				line = new Line( p, hull.points[hi] );
				lines.push( line );
				line.color='#ff0000';
				line.render();
				alert(line.toString());
				// insidePoints = line.getPoints();
				lineOrientation = line.point1.x - line.point2.x;
				insidePoints = Array();

				alert('points: '+ipoints.length);
				// coletando pontos fora
				for( var hj = 0; hj < ipoints.length; hj++ ){
					// debug('ini');
					point = ipoints[hj];
					d = distPontoReta( point, line );
					alert('dist. '+point.num+': '+d);
					// orientacao da reta (E -> D) pega pontos abaixo da reta
					if( lineOrientation < 0 ){
						if( d > 0 ){
				
							insidePoints.push( point );
							arrayRemove( ipoints, point );
						}
				
					} else { // orientacao da rela (E <- D) pega pontos acima da reta
						if( d < 0 ){
				
							insidePoints.push( point );
							arrayRemove( ipoints, point );
						}
					}
					// debug('fim');
				}
				alert('inside: '+insidePoints.length);
				// for( j = 0; j < insidePoints.length; j++ ){
					// insidePoints[j].color = '#ff0000';
					// insidePoints[j].render();
				// }
			}
		}
		alert(ipoints.length);
	}
	
	// ----------------------------------------------------------
	
	function Point( x, y, control ){

		this.type = 'point';
		this.x = x;
		this.y = y;
		this.size = 6;
		this.color = '#000000';
		this.control = false;
		this.selected = false;
		this.parents = Array();
		this.num = pNum;
		
		this.construct = function(){

			this.toleranceX = this.x - this.size/2;
			this.toleranceY = this.y - this.size/2;
			pNum++;
			
			if( control ){
				this.control = true;
				this.color = '#ff0000';
			}
		}
		
		this.select = function(){

			this.selected = true;
			context.fillStyle = this.color;
			this.render();
			context.fillStyle = '#ffffff';
			context.fillRect( this.toleranceX+1, this.toleranceY+1, this.size-2, this.size-2 );
		}
		
		this.unselect = function(){
			
			if( this.selected ){
				
				this.selected = false;
				context.fillStyle = '#000000';
				this.render();
			}
		}
		
		this.pick = function( px, py ){
			
			if( px > this.toleranceX && px < this.x + this.size && py > this.toleranceY && py < this.y + this.size )
				return true;
			
			return false;
		}

		this.render = function(){
			
			context.fillStyle = this.color;
			context.fillRect( this.toleranceX, this.toleranceY, this.size, this.size );
			// context.fillText( this.num, this.x+10, this.y );
		}
		
		this.clear = function(){

			context.clearRect( this.toleranceX, this.toleranceY, this.size, this.size );
		}
		
		this.remove = function(){

			arrayRemove( canvasPoints, this );
			arrayRemove( objects, this );
		}
		
		this.modify = function( px, py ){

			// oldX = this.x;
			// oldY = this.y;
			
			this.x = px;
			this.y = py;
			this.construct();
			// context.fillStyle = '#000000';

			// for( i = 0; i < this.parents.length; i++ )
				// this.parents[i].modify( this, oldX, oldY );
		}
		
		this.rotate = function( angle, centerX, centerY ){

			mr = (this.y - centerY) / (this.x - centerX);
			ar = Math.atan( mr ) * 180 / Math.PI;
			a1 = ar + angle;
			
			if( a1 % 90 == 0 && a1 % 180 != 0 ) m1 = null;
			else m1 = Math.tan( a1 * Math.PI / 180 );
			
			a2 = -( 180 - ar + ((180 - angle) / 2));
			m2 = Math.tan( a2 * Math.PI / 180 );
			
			if( m1 != null ){
				
				x = (m2*this.x - m1*centerX + centerY - this.y) / (m2 - m1);
				y = centerY - m1*centerX + m1*x;
				
			} else {
				
				if( ((a1 - 90) / 180) % 2 == 0 ) par = 1;
				else par = -1;
			
				x = centerX;
				y = centerY + ( par * Math.sqrt( Math.pow( centerX - this.x, 2 ) + Math.pow( centerY - this.y, 2 ) ) );
			}
			
			this.modify( x, y );
		}
		
		this.scale = function( dx, centerX, centerY ){
						
			ax = (this.x - centerX) * dx / 20;
			bx = (this.y - centerY) * dx / 20;
			
			this.modify( this.x + ax, this.y + bx );
		}
		
		this.mirror = function( line ){
			
			// coeficientes angulares das retas
			m1 = (line.point2.y - line.point1.y) / (line.point2.x - line.point1.x);
			m2 = -1 / m1;
			
			// equacoes das retas
			c1 = (m1 * line.point1.x) - line.point1.y;
			c2 = (m2 * this.x) - this.y;
			
			// ponto de encontro entre as retas
			x = (c2 - c1) / (m2 - m1);
			y = (m1 * x) - c1;
			
			dx = x - this.x;
			dy = y - this.y;
			
			this.modify( this.x + (dx*2), this.y + (dy*2) );
		}
		
		this.construct();
		canvasPoints.push( this );
		objects.push( this );
		this.render();
	}
	
	function Line( point1, point2, control ){
		
		this.type = 'line';
		this.point1 = point1;
		this.point2 = point2;
		this.control = false;
		this.color = '#000000';
		this.selected = false;
		this.tolerance = 3;
		this.parent = null;
		
		this.construct = function(){

			this.point1.parents.push( this );
			this.point2.parents.push( this );
			
			if( control ){
				this.control = true;
				this.color = '#cccccc';
			}
		}
		
		this.pick = function( px, py ){
			
			if( this.point1.x < this.point2.x ){
				
				if( px < this.point1.x - this.tolerance || px > this.point2.x + this.tolerance )
					return false;
				
			} else if( px < this.point2.x - this.tolerance || px > this.point1.x + this.tolerance )
				return false;
			
			if( this.point1.y < this.point2.y ){
				
				if( py < this.point1.y - this.tolerance || py > this.point2.y + this.tolerance )
					return false;
					
			} else if( py < this.point2.y - this.tolerance || py > this.point1.y + this.tolerance )
				return false;
			
			a = this.point1.y - this.point2.y;
			b = this.point2.x - this.point1.x;
			d = parseInt( mod( a*px + b*py + this.point1.x*this.point2.y - this.point2.x*this.point1.y ) / parseInt( Math.sqrt( a*a + b*b ) ) );
			
			return d <= this.tolerance;
		}
		
		this.select = function(){
			
			this.selected = true;
			this.color = '#ffffff';
			context.lineWidth = 2;
			this.render();
			this.color = '#ff0000';
			context.lineWidth = 1;
			this.render();
			this.point1.select();
			this.point2.select();
		}
		
		this.unselect = function(){
			
			if( this.selected ){
				
				this.selected = false;
				
				if( !this.control )
					this.color = '#000000';
				else
					this.color = '#cccccc';
					
				renderCanvas();
			}
		}
		
		this.render = function(){
			
			context.beginPath();
			context.moveTo( this.point1.x, this.point1.y );
			context.lineTo( this.point2.x, this.point2.y );
			context.strokeStyle = this.color;
			context.stroke();
		}
		
		this.modify = function( newPoint, oldPointX, oldPointY ){
			
			context.beginPath();
			
			if( newPoint == this.point1 )
				context.moveTo( this.point2.x, this.point2.y );	
			else
				context.moveTo( this.point1.x, this.point1.y );
			
			context.lineTo( oldPointX, oldPointY );
		}
		
		this.modifyPosition = function( dx, dy ){
			
			this.point1.modify( this.point1.x + dx, this.point1.y + dy );
			this.point2.modify( this.point2.x + dx, this.point2.y + dy );
		}
		
		this.clear = function(){
			
			context.beginPath();
			context.moveTo( this.point1.x, this.point1.y );
			context.lineTo( this.point2.x, this.point2.y );
			context.strokeStyle = '#ffffff';
			context.lineWidth = 3;
			context.stroke();
		}
		
		this.remove = function( removePoints ){
			
			arrayRemove( objects, this );
			
			if( removePoints == true ){
				
				this.point1.remove();
				this.point2.remove();
				
			} else {
				
				arrayRemove( this.point1.parents, this );
				arrayRemove( this.point2.parents, this );
			}
		}
		
		this.selectBoundingBox = function(){
			
			if( this.point1.x < this.point2.x )
				this.x = this.point1.x;
			else
				this.x = this.point2.x;
				
			if( this.point1.y < this.point2.y )
				this.y = this.point1.y;
			else
				this.y = this.point2.y;
				
			this.width = mod( this.point1.x - this.point2.x );
			this.height = mod( this.point1.y - this.point2.y );
			
			context.strokeStyle = '#dddddd';
			context.lineWidth = 1;
			context.rect( this.x, this.y, this.width, this.height );
			context.stroke();
		}
		
		this.rotate = function( dy ){
			
			angle = dy / this.height * 180;
			centerX = this.x + (this.width / 2);
			centerY = this.y + (this.height / 2);
			
			this.point1.rotate( angle, centerX, centerY );
			this.point2.rotate( angle, centerX, centerY );
		}
		
		this.scale = function( dx ){
			
			centerX = this.x + (this.width / 2);
			centerY = this.y + (this.height / 2);

			this.point1.scale( dx, centerX, centerY );
			this.point2.scale( dx, centerX, centerY );
		}
		
		this.mirror = function( line ){
			
			this.point1.mirror( line );
			this.point2.mirror( line );
		}
		
		this.toString = function(){
			
			return this.point1.num + '-' + this.point2.num;
		}
		
		this.construct();
		objects.push( this );
		this.render();
	}
	
	function Polygon( points, lines ){
		
		this.type = 'polygon';
		this.points = points;
		this.lines = lines;
		this.selected = false;
		this.color = '#000000';
		
		this.construct = function(){
			
			if( lines != null )
				for( i = 0; i < this.lines.length; i++ )
					this.lines[i].parent = this;
		}
		
		this.select = function(){
			
			this.selected = true;
			this.color = '#ffffff';
			context.lineWidth = 2;
			this.render();
			this.color = '#ff0000';
			context.lineWidth = 1;
			this.render();
			
			for( i = 1; i < this.points.length; i++ )
				this.points[i].select();

			for( i = 1; i < this.lines.length; i++ )
				this.lines[i].select();
		}
		
		this.pick = function( px, py ){
			
			for( i = 0; i < this.lines.length; i++ )
				if( this.lines[i].pick( px, py ) )
					return true;
			
			return false;
		}
		
		this.modifyPosition = function( dx, dy ){
			
			for( i = 0; i < this.points.length; i++ )
				this.points[i].modify( this.points[i].x + dx, this.points[i].y + dy );
		}
		
		this.selectBoundingBox = function(){
			
			minX = maxX = this.points[0].x;
			minY = maxY = this.points[0].y;
			
			for( i = 1; i < this.points.length; i++ ){
				
				if( this.points[i].x < minX )
					minX = this.points[i].x;
				
				else if( this.points[i].x > maxX )
					maxX = this.points[i].x;
					
				if( this.points[i].y < minY )
					minY = this.points[i].y;

				else if( this.points[i].y > maxY )
					maxY = this.points[i].y;
			}
			
			this.x = minX;
			this.y = minY;
			this.width = maxX - minX;
			this.height = maxY - minY;
			
			context.strokeStyle = '#dddddd';
			context.lineWidth = 1;
			context.rect( this.x, this.y, this.width, this.height );
			context.stroke();
		}
		
		this.rotate = function( dy ){
			
			angle = dy / this.height * 180;
			centerX = this.x + (this.width / 2);
			centerY = this.y + (this.height / 2);
			
			for( i = 0; i < this.points.length; i++ )
				this.points[i].rotate( angle, centerX, centerY );
		}
		
		this.scale = function( dx ){
			
			centerX = this.x + (this.width / 2);
			centerY = this.y + (this.height / 2);

			for( i = 0; i < this.points.length; i++ )
				this.points[i].scale( dx, centerX, centerY );
		}
		
		this.mirror = function( line ){
			
			for( i = 0; i < this.points.length; i++ )
				this.points[i].mirror( line );
		}
		
		this.render = function(){

			context.moveTo( this.points[0].x, this.points[0].y );
			
			for( i = 1; i < this.points.length; i++ )
				context.lineTo( this.points[i].x, this.points[i].y );
			
			context.closePath();
			context.strokeStyle = this.color;
			context.stroke();
		}
		
		this.construct();
		this.render();
	}
	
	function QuadraticCurve( point1, point2, controlPoint ){
		
		this.type = 'quadraticCurve';
		this.point1 = point1;
		this.point2 = point2;
		this.controlPoint = controlPoint;
		
		this.color = '#000000';
		this.selected = false;
		
		this.construct = function(){
			
			this.point1.parents.push( this );
			this.point2.parents.push( this );
			
			if( this.controlPoint == null )
				this.controlPoint = new Point( this.point1.x, this.point1.y, true );
			
			this.controlPoint.parents.push( this );
		}
		
		this.updateControl = function(){
			
			cx = this.point1.x + parseInt( (this.point2.x - this.point1.x) / 2 );
			cy = this.point1.y + parseInt( (this.point2.y - this.point1.y) / 2 );
			this.controlPoint.modify( cx, cy );
		}
		
		this.select = function(){
			
			this.selected = true;
			this.color = '#ffffff';
			context.lineWidth = 2;
			this.render();
			this.color = '#ff0000';
			context.lineWidth = 1;
			this.render();
			this.point1.select();
			this.point2.select();
		}
		
		this.unselect = function(){
			
			if( this.selected ){
				
				this.selected = false;
				this.color = '#000000';
				renderCanvas();
			}
		}
		
		this.pick = function( px, py ){
			
			context.beginPath();
			context.moveTo( this.point1.x, this.point1.y );
			context.quadraticCurveTo( this.controlPoint.x, this.controlPoint.y, this.point2.x, this.point2.y );

			return context.isPointInPath( px, py );
		}
		
		this.render = function(){
			
			context.beginPath();
			context.moveTo( this.point1.x, this.point1.y );
			context.quadraticCurveTo( this.controlPoint.x, this.controlPoint.y, this.point2.x, this.point2.y );
			context.strokeStyle = this.color;
			context.stroke();
		}
		
		this.modify = function( newPoint, oldPointX, oldPointY ){
			
			context.beginPath();
			
			if( newPoint.control ){
				
				context.moveTo( this.point1.x, this.point1.y );
				context.quadraticCurveTo( oldPointX, oldPointY, this.point2.x, this.point2.y );
				
			} else {
				
				if( newPoint == this.point1 )
					context.moveTo( this.point2.x, this.point2.y );
				else
					context.moveTo( this.point1.x, this.point1.y );
			
				context.quadraticCurveTo( this.controlPoint.x, this.controlPoint.y, oldPointX, oldPointY );
			}
		}
		
		this.modifyPosition = function( dx, dy ){
			
			this.point1.modify( this.point1.x + dx, this.point1.y + dy );
			this.point2.modify( this.point2.x + dx, this.point2.y + dy );
			this.controlPoint.modify( this.controlPoint.x + dx, this.controlPoint.y + dy );
		}
		
		this.selectBoundingBox = function(){
			
			minX = maxX = this.point1.x;
			minY = maxY = this.point1.y;
			points = [ this.point2, this.controlPoint ];
			
			for( i = 0; i < points.length; i++ ){
				
				if( points[i].x < minX )
					minX = points[i].x;
				
				else if( points[i].x > maxX )
					maxX = points[i].x;
					
				if( points[i].y < minY )
					minY = points[i].y;

				else if( points[i].y > maxY )
					maxY = points[i].y;
			}
			
			this.x = minX;
			this.y = minY;
			this.width = maxX - minX;
			this.height = maxY - minY;
			
			context.strokeStyle = '#dddddd';
			context.lineWidth = 1;
			context.rect( this.x, this.y, this.width, this.height );
			context.stroke();
		}
		
		this.rotate = function( dy ){
			
			angle = dy / this.height * 180;
			centerX = this.x + (this.width / 2);
			centerY = this.y + (this.height / 2);
			
			this.point1.rotate( angle, centerX, centerY );
			this.point2.rotate( angle, centerX, centerY );
			this.controlPoint.rotate( angle, centerX, centerY );
		}
		
		this.scale = function( dx ){
			
			centerX = this.x + (this.width / 2);
			centerY = this.y + (this.height / 2);

			this.point1.scale( dx, centerX, centerY );
			this.point2.scale( dx, centerX, centerY );
			this.controlPoint.scale( dx, centerX, centerY );
		}
		
		this.mirror = function( line ){
			
			this.point1.mirror( line );
			this.point2.mirror( line );
			this.controlPoint.mirror( line );
		}
		
		this.construct();
		objects.push( this );
		this.render();
	}
	
	function BezierCurve( point1, point2, controlPoint1, controlPoint2 ){
		
		this.type = 'bezierCurve';
		this.point1 = point1;
		this.point2 = point2;
		this.controlPoint1 = controlPoint1;
		this.controlPoint2 = controlPoint2;
		
		this.color = '#000000';
		this.selected = false;
		
		this.construct = function(){
			
			this.point1.parents.push( this );
			this.point2.parents.push( this );
			
			if( this.controlPoint1 == null && this.controlPoint2 == null ){
				
				this.controlPoint1 = new Point( this.point1.x, this.point1.y, true );
				this.controlPoint2 = new Point( this.point2.x, this.point2.y, true );
			}
			
			this.controlPoint1.parents.push( this );
			this.controlPoint2.parents.push( this );
			
			new Line( this.point1, this.controlPoint1, true );
			new Line( this.point2, this.controlPoint2, true );
		}
		
		this.updateControl = function(){
			
			cx = this.point1.x + parseInt( (this.point2.x - this.point1.x) / 3 );
			cy = this.point1.y + parseInt( (this.point2.y - this.point1.y) / 3 );
			this.controlPoint1.modify( cx, cy );
			
			cx = this.point2.x - parseInt( (this.point2.x - this.point1.x) / 3 );
			cy = this.point2.y - parseInt( (this.point2.y - this.point1.y) / 3 );
			this.controlPoint2.modify( cx, cy );
		}
		
		this.pick = function( px, py ){
			
			context.beginPath();
			context.moveTo( this.point1.x, this.point1.y );
			context.bezierCurveTo( this.controlPoint1.x, this.controlPoint1.y, this.controlPoint2.x, this.controlPoint2.y, this.point2.x, this.point2.y );
			return context.isPointInPath( px, py );
		}
		
		this.select = function(){
			
			this.selected = true;
			this.color = '#ffffff';
			context.lineWidth = 2;
			this.render();
			this.color = '#ff0000';
			context.lineWidth = 1;
			this.render();
			this.point1.select();
			this.point2.select();
		}
		
		this.unselect = function(){
			
			if( this.selected ){

				this.selected = false;
				this.color = '#000000';
				renderCanvas();
			}
		}
		
		this.render = function(){
			
			context.beginPath();
			context.moveTo( this.point1.x, this.point1.y );
			context.bezierCurveTo( this.controlPoint1.x, this.controlPoint1.y, this.controlPoint2.x, this.controlPoint2.y, this.point2.x, this.point2.y );
			context.strokeStyle = this.color;
			context.stroke();
		}
		
		this.modify = function( newPoint, oldPointX, oldPointY ){
			
			context.beginPath();
			
			if( newPoint.control ){
				
				context.moveTo( this.point1.x, this.point1.y );
				
				if( newPoint == this.controlPoint1 )
					context.bezierCurveTo( oldPointX, oldPointY, this.controlPoint2.x, this.controlPoint2.y, this.point2.x, this.point2.y );
				else
					context.bezierCurveTo( this.controlPoint1.x, this.controlPoint1.y, oldPointX, oldPointY, this.point2.x, this.point2.y );
				
			} else {
				
				if( newPoint == this.point1 ){
					
					context.moveTo( this.point2.x, this.point2.y );
					context.bezierCurveTo( this.controlPoint2.x, this.controlPoint2.y, this.controlPoint1.x, this.controlPoint1.y, oldPointX, oldPointY );
					
				} else {
					
					context.moveTo( this.point1.x, this.point1.y );
					context.bezierCurveTo( this.controlPoint1.x, this.controlPoint1.y, this.controlPoint2.x, this.controlPoint2.y, oldPointX, oldPointY );
				}
			}
		}
		
		this.modifyPosition = function( dx, dy ){
			
			this.point1.modify( this.point1.x + dx, this.point1.y + dy );
			this.point2.modify( this.point2.x + dx, this.point2.y + dy );
			this.controlPoint1.modify( this.controlPoint1.x + dx, this.controlPoint1.y + dy );
			this.controlPoint2.modify( this.controlPoint2.x + dx, this.controlPoint2.y + dy );
		}
		
		this.selectBoundingBox = function(){
			
			minX = maxX = this.point1.x;
			minY = maxY = this.point1.y;
			points = [ this.point2, this.controlPoint1, this.controlPoint2 ];
			
			for( i = 0; i < points.length; i++ ){
				
				if( points[i].x < minX )
					minX = points[i].x;
				
				else if( points[i].x > maxX )
					maxX = points[i].x;
					
				if( points[i].y < minY )
					minY = points[i].y;

				else if( points[i].y > maxY )
					maxY = points[i].y;
			}
			
			this.x = minX;
			this.y = minY;
			this.width = maxX - minX;
			this.height = maxY - minY;
			
			context.strokeStyle = '#dddddd';
			context.lineWidth = 1;
			context.rect( this.x, this.y, this.width, this.height );
			context.stroke();
		}
		
		this.rotate = function( dy ){
			
			angle = dy / this.height * 180;
			centerX = this.x + (this.width / 2);
			centerY = this.y + (this.height / 2);
			
			this.point1.rotate( angle, centerX, centerY );
			this.point2.rotate( angle, centerX, centerY );
			this.controlPoint1.rotate( angle, centerX, centerY );
			this.controlPoint2.rotate( angle, centerX, centerY );
		}
		
		this.scale = function( dx ){
			
			centerX = this.x + (this.width / 2);
			centerY = this.y + (this.height / 2);

			this.point1.scale( dx, centerX, centerY );
			this.point2.scale( dx, centerX, centerY );
			this.controlPoint1.scale( dx, centerX, centerY );
			this.controlPoint2.scale( dx, centerX, centerY );
		}
		
		this.mirror = function( line ){
			
			this.point1.mirror( line );
			this.point2.mirror( line );
			this.controlPoint1.mirror( line );
			this.controlPoint2.mirror( line );
		}
		
		this.construct();
		objects.push( this );
		this.render();
	}
	
	function Text( x, y, string, size ){
		
		this.x = x;
		this.y = y;
		this.size = size;
		this.string = string;
		this.width = null;
		this.height = size;
		this.selected = false;
		this.color = '#000000';
		this.type = 'text';
		
		this.construct = function(){
			
			context.font = 'normal '+ this.size +'px Arial';
			this.width = context.measureText( string ).width;
		}
		
		this.select = function(){
			
			this.selected = true;
			this.color = '#ff0000';
			this.render();
		}
		
		this.unselect = function(){
			
			if( this.selected ){

				this.selected = false;
				this.color = '#000000';
				renderCanvas();
			}
		}
		
		this.pick = function( px, py ){
			
			return px > this.x && px < this.x + this.width && py > this.y - this.height && py < this.y;
		}
		
		this.modifyPosition = function( dx, dy ){
			
			this.x += dx;
			this.y += dy;
		}
		
		this.render = function(){
			
			context.font = 'normal '+ this.size +'px Arial';
			context.fillStyle = this.color;
			context.fillText( this.string, this.x, this.y );
		}
		
		this.construct();
		objects.push( this );
		this.render();
	}
	
});