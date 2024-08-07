import React, { useEffect, useState } from 'react';
import { initGoogleClient, signIn, signOut } from './googleAuth';
import SpeechRecognitionComponent from './SpeechRecognitionComponent';


function App() {
  const PRESENTATION_ID = '1vQ9ze5URkngSXGjCT7iMXdk1wZPHHotJ5qfrsCmWLLU'
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [slides, setSlides] = useState([]);
  const [slideTexts, setSlideTexts] = useState({});
  const [iframeKey, setIframeKey] = useState(Date.now()); 
  const [shapes, setShapes] = useState([]);

  useEffect(() => {
    initGoogleClient();
    window.gapi.load('auth2', () => {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (authInstance) {
        setIsSignedIn(authInstance.isSignedIn.get());
        authInstance.isSignedIn.listen(setIsSignedIn);
      }
    });
  }, []);

  const handleSignIn = async () => {
    await signIn();
    fetchSlides();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const fetchSlides = async () => {
    try {
      if (window.gapi.client.slides) {
        const response = await window.gapi.client.slides.presentations.get({
          presentationId: PRESENTATION_ID, // Only use the presentation ID
        });
        const slides = response.result.slides;
        console.log('Fetched slides:', slides); // Debug: log fetched slides
        const texts = extractTextFromSlides(slides);
        setSlides(slides);
        setSlideTexts(texts);
        setShapes(extractShapes(slides));
        setIframeKey(Date.now()); // Force iframe re-render
      } else {
        console.error("Google Slides API not loaded");
      }
    } catch (error) {
      console.error("Error fetching slides:", error);
    }
  };

  const extractShapes = (slides) => {
    const shapes = [];
    slides.forEach(slide => {
      slide.pageElements.forEach(element => {
        if (element.shape) {
          shapes.push({
            objectId: element.objectId,
            pageObjectId: slide.objectId,
            size: element.size,
            transform: element.transform,
            shapeType: element.shape.shapeType,
          });
        }
      });
    });
    return shapes;
  };

  const extractTextFromSlides = (slides) => {
    const texts = {};
    slides.forEach((slide, slideIndex) => {
      const slideTexts = [];
      slide.pageElements.forEach((pageElement) => {
        if (pageElement.shape && pageElement.shape.text) {
          const text = pageElement.shape.text.textElements
            .map(te => te.textRun ? te.textRun.content : '')
            .join('');
            if (text) {
              console.log(`Slide ${slideIndex + 1}, text:`, text); // Debug: log individual text elements
            }
          slideTexts.push(text);
        }
      });
      texts[slideIndex] = slideTexts;
    });
    return texts;
  };

  const addShape = async (slideId, color, shapeType, text = '') => {
    try {
      const shapeId = color + "-" + shapeType + "-" + String(Math.round((Math.random())*100));
      console.log(shapeId)
      const textBoxId = "idtext-" + shapeId;
      
      const requests = [
        {
          createShape: {
            objectId: shapeId, // Unique ID for the shape
            shapeType: shapeType,
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: {
                  magnitude: 100,
                  unit: 'PT'
                },
                width: {
                  magnitude: 300,
                  unit: 'PT'
                }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 100,
                translateY: 100,
                unit: 'PT'
              }
            }
          }
        },
        {
          createShape: {
            objectId: textBoxId, // Unique ID for the text box
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: {
                height: {
                  magnitude: 30,
                  unit: 'PT'
                },
                width: {
                  magnitude: 150,
                  unit: 'PT'
                }
              },
              transform: {
                scaleX: 1,
                scaleY: 1,
                translateX: 100,
                translateY: 70, // Position it below the main shape
                unit: 'PT'
              }
            }
          }
        },
        {
          insertText: {
            objectId: textBoxId,
            text: shapeId // Insert the shape ID as text
          }
          
        },
        {
          updateTextStyle: {
            objectId: textBoxId,
            textRange: {
              type: 'FIXED_RANGE',
              startIndex: 5,
              endIndex: 10,
            },
            style: {
              fontFamily: 'Times New Roman',
              fontSize: {
                magnitude: 14,
                unit: 'PT',
              },
              foregroundColor: {
                opaqueColor: {
                  rgbColor: {
                    blue: 1.0,
                    green: 0.0,
                    red: 0.0,
                  },
                },
              },
            },
            fields: 'foregroundColor,fontFamily,fontSize',
          },
        },
      ];

      if (text) {
        requests.push({
          insertText: {
            objectId: shapeId,
            text
          }
        });
      }

      const response = await window.gapi.client.slides.presentations.batchUpdate({
        presentationId: PRESENTATION_ID,
        requests
      });

      console.log('Shape and text box added:', response);
      fetchSlides(); // Refresh slides to show the new shape and text box
    } catch (error) {
      console.error('Error adding shape:', error);
    }
  };

  const moveShape = async (shapeId, newX, newY) => {
    try {
      const shape = shapes.find(s => s.objectId === shapeId);
      if (!shape) {
        console.error('Shape not found');
        return;
      }

      const requests = [
        {
          updatePageElementTransform: {
            objectId: shapeId,
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: newX,
              translateY: newY,
              unit: 'PT'
            },
            applyMode: 'RELATIVE'
          }
        },
        {
          updatePageElementTransform: {
            objectId: "idtext-" + shapeId,
            transform: {
              scaleX: 1,
              scaleY: 1,
              translateX: newX,
              translateY: newY,
              unit: 'PT'
            },
            applyMode: 'RELATIVE'
          }
        },
      ];

      const response = await window.gapi.client.slides.presentations.batchUpdate({
        presentationId: PRESENTATION_ID,
        requests
      });

      console.log('Shape moved:', response);
      fetchSlides();
    } catch (error) {
      console.error('Error moving shape:', error);
    }
  };


  const handleUserRequest = async (userRequest) => {
    // Process userRequest to perform actions like addShape, moveShape, updateTextColors
    console.log("HERE");
    console.log('User Request:', userRequest);
  };

  return (
    <div className="App">
      <header className="App-header">
        {isSignedIn ? (
          <>
            <button onClick={handleSignOut}>Sign Out</button>
            <button onClick={fetchSlides}>Fetch Slides</button>
            <button onClick={() => addShape(slides[0].objectId, 'blue', 'RECTANGLE')}>Add Text Box</button> {/* Add button to add a text box */}
            <button onClick={() => moveShape("blue-RECTANGLE-41", 100, 0)}>Move Box</button> {/* Add button to add a text box */}
            <SpeechRecognitionComponent onCommand={handleUserRequest} />
            <div className="slide-container">
              <div className="iframe-wrapper">
                <iframe
                  key={iframeKey} // Use key to force refresh
                  title={"googleslidesframe"}
                  src={`https://docs.google.com/presentation/d/${PRESENTATION_ID}/embed?start=false&loop=false&delayms=3000`}
                  width="960"
                  height="569"
                  allowFullScreen
                ></iframe>
                <div className="overlay">
                  {shapes.map((shape, index) => (
                    <div
                      key={index}
                      className="shape-info"
                      style={{
                        top: `${shape.transform.translateY}px`,
                        left: `${shape.transform.translateX}px`,
                        width: `${shape.size.width.magnitude}px`,
                        height: `${shape.size.height.magnitude}px`,
                        zIndex: 1000
                      }}
                    >
                      {shape.objectId}
                    </div>
                  ))}
                </div>
              </div>
            </div>
              <div>
              <h2>Slide Texts</h2>
              {Object.keys(slideTexts).map((slideIndex) => (
                <div key={slideIndex}>
                  <h3>Slide {parseInt(slideIndex) + 1}</h3>
                  <ul>
                    {slideTexts[slideIndex].map((text, index) => (
                      <li key={index}>{text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </>
        ) : (
          <button onClick={handleSignIn}>Sign In with Google</button>
        )}
      </header>
    </div>
  );
}

export default App;