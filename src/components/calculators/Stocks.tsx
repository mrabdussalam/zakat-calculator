import { StockCalculator } from '@/components/calculators/stocks/StockCalculator';

// Default props for standalone usage
const defaultProps = {
  currency: 'USD',
  onUpdateValues: () => {},
  onHawlUpdate: () => {},
  onCalculatorChange: () => {}
};

const Stocks = () => {
  return <StockCalculator {...defaultProps} />;
};

export default Stocks; 