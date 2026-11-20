const TradingViewComponent = () => {
    return (
        <iframe
            id='trading-view-iframe'
            title='Advanced TradingView chart'
            style={{ width: '100%', height: '100%', backgroundColor: 'white', border: 0 }}
            src='https://charts.deriv.com/deriv?hide-signup=true'
        />
    );
};

export default TradingViewComponent;
