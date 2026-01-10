import React from 'react';
import { FaBolt, FaTruck, FaAward } from 'react-icons/fa';
import './FlashSaleBar.css';

const FlashSaleBar = () => {
    return (
        <div className="flash-sale-bar">
            <div className="container flash-content">
                <div className="flash-item">
                    <FaBolt />
                    <span>Flash Sale: Up to 70% OFF on Fashion</span>
                </div>
                <div className="divider">|</div>
                <div className="flash-item">
                    <FaTruck />
                    <span>Free Shipping on Orders Over ₹50</span>
                </div>
                <div className="divider">|</div>
                <div className="flash-item">
                    <FaAward />
                    <span>Loyalty Program: Earn Points on Every Purchase</span>
                </div>
            </div>
        </div>
    );
};

export default FlashSaleBar;
