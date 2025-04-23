import React from 'react';
import { Card, Typography } from '@material-ui/core';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import LogoBox from '../public/LogoBox.svg';
import ColabIcon from '../public/colab.svg';
import { BrowserView, MobileView, isBrowser, isMobile } from 'react-device-detect';

const datasets = [
    {
        id: 'exemplar-001',
        name: 'Lung Adenocarcinoma Specimen',
        description: "From a larger tissue microarray (TMA), imaged using CyCIF with three cycles. Each cycle consists of six four-channel image tiles.",
        colabLink: "https://colab.research.google.com/drive/19R40QsP7f5ZRu6L3BRfc3317_66yRL7S#scrollTo=q1CVlvWXjCKo"
    },
    {
        id: 'SDSS',
        name: 'Sloan Digital Sky Survey',
        description: "Multi-spectral SDSS imaging of galaxies NGC 450 and UGC 807, capturing structural and spectral features across five filters",
    }
];

function LandingPage() {
    const navigate = useNavigate();

    return (
        <section>
            {/* Wave needs to be behind content */}
            <div className="wave" style={{ zIndex: 0 }}>
                <span></span>
                <span></span>
                <span></span>
            </div>

            <div style={{
                padding: '20px',
                maxWidth: '1200px',
                margin: '0 auto',
                textAlign: 'center',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Logo */}
                <img
                    src={LogoBox}
                    alt="SEAL Logo Box"
                    style={{
                        width: 'auto',
                        height: '30vh',
                        marginBottom: '0'
                    }}
                />

                {/* Title */}
                <Typography
                    variant="h4"
                    className="title-text"
                    style={{
                        color: '#ffffff',
                        marginBottom: '20px'
                    }}
                >
                    <span style={{ color: '#4973ff' }}>SEAL</span>: <span>
                        <span style={{ color: '#4973ff' }}>S</span>patially-resolved
                        <span style={{ color: '#4973ff' }}> E</span>mbedding
                        <span style={{ color: '#4973ff' }}> A</span>nalysis with
                        <span style={{ color: '#4973ff' }}> L</span>inked
                    </span> Imaging Data
                </Typography>

                {/* Authors */}
                <Typography
                    variant="h5"
                    className="authors-text"
                    style={{
                        color: '#ffffff',
                        marginBottom: '10px'
                    }}
                >
                    Simon Warchol<sup>1,2</sup>, Grace Guo<sup>1,2</sup>, Johannes Knittel<sup>1</sup>, Dan Freeman<sup>2</sup>, Usha Bhalla<sup>1</sup>, Jeremy Muhlich<sup>2</sup>, Peter K. Sorger<sup>2</sup>, and Hanspeter Pfister<sup>1</sup>
                </Typography>

                {/* Affiliations - simplified */}
                <div style={{
                    marginBottom: '40px',
                    fontSize: '0.8em'
                }}>
                    <Typography
                        className="affiliations-text"
                        style={{
                            color: '#ffffff',
                            marginBottom: '4px'
                        }}
                    >
                        <sup>1</sup> Harvard John A. Paulson School of Engineering and Applied Sciences
                    </Typography>
                    <Typography
                        className="affiliations-text"
                        style={{
                            color: '#ffffff'
                        }}
                    >
                        <sup>2</sup> Laboratory of Systems Pharmacology, Harvard Medical School
                    </Typography>
                </div>

                {/* Mobile Warning */}
                <MobileView>
                    <div style={{
                        backgroundColor: 'rgba(255, 87, 34, 0.9)',  // Warning orange
                        color: 'white',
                        padding: '12px',
                        marginBottom: '20px',
                        borderRadius: '4px',
                        fontSize: '0.9rem',
                        textAlign: 'left'
                    }}>
                        <Typography style={{ color: '#ffffff', fontWeight: 'bold', marginBottom: '4px' }}>
                            ⚠️ Mobile Device Detected
                        </Typography>
                        <Typography style={{ color: '#ffffff', fontSize: '0.8rem' }}>
                            The SEAL demos are designed for desktop viewing. For the best experience, please access them on a computer.
                        </Typography>
                    </div>
                </MobileView>

                {/* Dataset Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '15px'
                }}>
                    {datasets.map((dataset) => (
                        <Card
                            key={dataset.id}
                            style={{
                                backgroundColor: 'rgba(44, 62, 80, 0.8)',
                                padding: '20px',
                                cursor: 'pointer'
                            }}
                        >
                            <div onClick={() => navigate(`/${dataset.id}`)}>
                                <Typography variant="h5" style={{ color: '#ffffff' }}>
                                    {dataset.name}
                                </Typography>
                                <Typography style={{ color: '#cccccc' }}>
                                    {dataset.description}
                                </Typography>
                            </div>
                            {dataset.colabLink && (
                                <div style={{
                                    marginTop: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    <img 
                                        src={ColabIcon} 
                                        alt="Google Colab" 
                                        style={{ 
                                            width: '20px', 
                                            height: '20px',
                                            filter: 'invert(1)'
                                        }} 
                                    />
                                    <Typography
                                        component="a"
                                        href={dataset.colabLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: '#ffffff',
                                            textDecoration: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Open in Colab
                                    </Typography>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default LandingPage; 