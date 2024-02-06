import React from 'react';
import RecalculateStock from '../../Components/Recalculation/RecalculateStock';

const RecalculationScreen = () => {
  return (
    <div className="default-screen recalculation-screen fadeIn">
      <div className="wrapper">
        <div className="content">
          <RecalculateStock />
        </div>
      </div>
    </div>
  );
};

export default RecalculationScreen;
