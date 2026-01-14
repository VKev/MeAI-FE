const loaderStyles = `
  .meai-loader {
    width: 80px;
    height: 50px;
    position: relative;
  }

  .meai-loader-text {
    position: absolute;
    top: 0;
    padding: 0;
    margin: 0;
    color: #c8b6ff;
    animation: meai-text 3.5s ease both infinite;
    font-size: 0.8rem;
    letter-spacing: 1px;
  }

  .meai-load {
    background-color: #9a79ff;
    border-radius: 50px;
    display: block;
    height: 16px;
    width: 16px;
    bottom: 0;
    position: absolute;
    transform: translateX(64px);
    animation: meai-loading 3.5s ease both infinite;
  }

  .meai-load::before {
    position: absolute;
    content: '';
    width: 100%;
    height: 100%;
    background-color: #d1c2ff;
    border-radius: inherit;
    animation: meai-loading2 3.5s ease both infinite;
  }

  @keyframes meai-text {
    0% {
      letter-spacing: 1px;
      transform: translateX(0px);
    }

    40% {
      letter-spacing: 2px;
      transform: translateX(26px);
    }

    80% {
      letter-spacing: 1px;
      transform: translateX(32px);
    }

    90% {
      letter-spacing: 2px;
      transform: translateX(0px);
    }

    100% {
      letter-spacing: 1px;
      transform: translateX(0px);
    }
  }

  @keyframes meai-loading {
    0% {
      width: 16px;
      transform: translateX(0px);
    }

    40% {
      width: 100%;
      transform: translateX(0px);
    }

    80% {
      width: 16px;
      transform: translateX(64px);
    }

    90% {
      width: 100%;
      transform: translateX(0px);
    }

    100% {
      width: 16px;
      transform: translateX(0px);
    }
  }

  @keyframes meai-loading2 {
    0% {
      transform: translateX(0px);
      width: 16px;
    }

    40% {
      transform: translateX(0%);
      width: 80%;
    }

    80% {
      width: 100%;
      transform: translateX(0px);
    }

    90% {
      width: 80%;
      transform: translateX(15px);
    }

    100% {
      transform: translateX(0px);
      width: 16px;
    }
  }
`;

const Loader = () => {
  return (
    <div className="meai-loader-wrapper">
      <style>{loaderStyles}</style>
      <div className="meai-loader">
        <span className="meai-loader-text">loading</span>
        <span className="meai-load" />
      </div>
    </div>
  );
};

export default Loader;
