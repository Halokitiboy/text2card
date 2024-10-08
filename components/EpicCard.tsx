// components/EpicCard.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { Download, Copy, Trash2, Shuffle, Smartphone } from 'lucide-react';
import html2canvas from 'html2canvas';
import { ColorTheme, colorThemes, defaultThemeIndex } from '../app/colorThemes';
import TextPreview from './TextPreview';
import ThemeSelector from './ThemeSelector';
import { Switch } from "./ui/switch";

const fallbackDefaultText = `
I was surprised, as always, that how easy it was to leave—how good it felt to be gone, to be on the move, to be someplace where I had never been before and where I was never going to be again.


我总是不假思索地在上路，因为出发的感觉真是太好了，世界突然充满了可能性。


- John Krakauer, Into the Wild.`;

interface EpicCardProps {
    defaultText?: string;
    theme?: ColorTheme;
}

const EpicCard: React.FC<EpicCardProps> = ({
                                               defaultText = fallbackDefaultText,
                                               theme = colorThemes[defaultThemeIndex]
                                           }) => {
    const [text, setText] = useState<string>(defaultText);
    const [fontsLoaded, setFontsLoaded] = useState<boolean>(false);
    const [randomLayout, setRandomLayout] = useState<boolean>(false);
    const [currentTheme, setCurrentTheme] = useState<ColorTheme>(theme);
    const [isPortraitMode, setIsPortraitMode] = useState<boolean>(false);
    const canvasRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        document.fonts.ready.then(() => {
            setFontsLoaded(true);
        });

        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        setText(defaultText);
    }, [defaultText]);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const trimTransparentCanvas = (canvas: HTMLCanvasElement) => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return canvas;

        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const l = pixels.data.length;
        const bound = {
            top: null,
            left: null,
            right: null,
            bottom: null
        };

        for (let i = 0; i < l; i += 4) {
            if (pixels.data[i + 3] !== 0) {
                const x = (i / 4) % canvas.width;
                const y = ~~((i / 4) / canvas.width);

                if (bound.top === null) {
                    bound.top = y;
                }

                if (bound.left === null) {
                    bound.left = x;
                } else if (x < bound.left) {
                    bound.left = x;
                }

                if (bound.right === null) {
                    bound.right = x;
                } else if (bound.right < x) {
                    bound.right = x;
                }

                if (bound.bottom === null) {
                    bound.bottom = y;
                } else if (bound.bottom < y) {
                    bound.bottom = y;
                }
            }
        }

        const trimHeight = bound.bottom! - bound.top! + 1;
        const trimWidth = bound.right! - bound.left! + 1;
        const trimmed = ctx.getImageData(bound.left!, bound.top!, trimWidth, trimHeight);

        const trimmedCanvas = document.createElement('canvas');
        trimmedCanvas.width = trimWidth;
        trimmedCanvas.height = trimHeight;
        trimmedCanvas.getContext('2d')!.putImageData(trimmed, 0, 0);

        return trimmedCanvas;
    };

    const handleDownload = () => {
        if (canvasRef.current) {
            const element = canvasRef.current;
            const scale = isMobile ? 4 : 2; // Increase scale for mobile devices

            html2canvas(element, {
                backgroundColor: null,
                scale: scale,
                logging: false,
                useCORS: true,
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('.text-preview');
                    if (clonedElement instanceof HTMLElement) {
                        clonedElement.style.overflow = 'hidden';
                    }
                }
            }).then((canvas) => {
                const trimmedCanvas = trimTransparentCanvas(canvas);

                // Convert to a higher quality PNG
                const link = document.createElement('a');
                link.download = 'Text2Card.png';
                link.href = trimmedCanvas.toDataURL('image/png', 1.0); // Use maximum quality
                link.click();
            });
        }
    };

    const handleCopy = () => {
        if (canvasRef.current) {
            html2canvas(canvasRef.current, {
                backgroundColor: null,
                scale: 2,
                logging: false,
                useCORS: true,
            }).then((canvas) => {
                const trimmedCanvas = trimTransparentCanvas(canvas);
                trimmedCanvas.toBlob((blob) => {
                    if (blob) {
                        navigator.clipboard.write([
                            new ClipboardItem({ 'image/png': blob })
                        ]).then(() => {
                            alert('Image copied to clipboard');
                        }).catch(err => {
                            console.error('Copy failed:', err);
                            alert('Copy failed, please try again');
                        });
                    }
                });
            });
        }
    };

    const handleClear = () => {
        setText('');
    };

    const handleRandomLayout = () => {
        setRandomLayout(prev => !prev);
    };

    const handlePortraitModeToggle = () => {
        setIsPortraitMode(prev => !prev);
    };

    const handleThemeChange = (newTheme: ColorTheme) => {
        setCurrentTheme(newTheme);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className={`flex flex-col xl:flex-row gap-8 md:gap-12 ${isPortraitMode ? 'max-w-4xl mx-auto' : ''}`}>
                <div className={`flex-1 flex flex-col ${isPortraitMode ? 'xl:w-1/2' : ''}`}>
                    <div className="flex justify-between items-center mb-4">
                        <ThemeSelector
                            themes={colorThemes}
                            currentTheme={currentTheme}
                            onThemeChange={handleThemeChange}
                        />
                    </div>
                    <Textarea
                        placeholder="Enter your text here..."
                        value={text}
                        onChange={handleTextChange}
                        className="w-full flex-grow mb-6 huiwen-font rounded-xl text-base md:text-lg lg:text-xl p-4 md:p-6 border-2 border-gray-300 focus:border-[#166434] transition-colors duration-200"
                        style={{ minHeight: '250px', whiteSpace: 'pre-wrap', borderColor: currentTheme.websiteTheme }}
                    />
                    <div className="flex flex-wrap gap-4 justify-between mb-4">
                        <div className="flex flex-wrap gap-4">
                            <Button
                                onClick={handleDownload}
                                className="huiwen-font text-white hover:bg-opacity-80 rounded-xl text-sm md:text-base py-3 px-6 transition-colors duration-200"
                                style={{ backgroundColor: currentTheme.websiteTheme }}
                            >
                                <Download className="mr-2 h-5 w-5" /> Download
                            </Button>
                            {!isMobile && (
                                <Button
                                    onClick={handleCopy}
                                    className="huiwen-font bg-gray-200 text-black hover:bg-gray-300 rounded-xl text-sm md:text-base py-3 px-6 transition-colors duration-200"
                                >
                                    <Copy className="mr-2 h-5 w-5" /> Copy
                                </Button>
                            )}
                            <Button
                                onClick={handleClear}
                                className="huiwen-font bg-red-500 text-white hover:bg-red-600 rounded-xl text-sm md:text-base py-3 px-6 transition-colors duration-200"
                            >
                                <Trash2 className="mr-2 h-5 w-5" /> Clear
                            </Button>
                            <Button
                                onClick={handleRandomLayout}
                                className="huiwen-font bg-purple-500 text-white hover:bg-purple-600 rounded-xl text-sm md:text-base py-3 px-6 transition-colors duration-200"
                            >
                                <Shuffle className="mr-2 h-5 w-5" /> Random Layout
                            </Button>
                            <Button
                                onClick={handlePortraitModeToggle}
                                className={`huiwen-font text-white rounded-xl text-sm md:text-base py-3 px-6 transition-colors duration-200 flex items-center ${isPortraitMode ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}
                            >
                                <Smartphone className="mr-2 h-5 w-5" />
                                <span className="mr-2">{isPortraitMode ? 'Portrait' : 'Landscape'}</span>
                                <Switch
                                    id="portrait-mode"
                                    checked={isPortraitMode}
                                    onCheckedChange={handlePortraitModeToggle}
                                    className="scale-75"
                                />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className={`flex-1 w-full ${isPortraitMode ? 'xl:w-1/2' : ''}`} ref={canvasRef}>
                    <TextPreview
                        text={text}
                        fontsLoaded={fontsLoaded}
                        randomLayout={randomLayout}
                        theme={currentTheme}
                        isPortraitMode={isPortraitMode}
                    />
                </div>
            </div>
        </div>
    );
};

export default EpicCard;