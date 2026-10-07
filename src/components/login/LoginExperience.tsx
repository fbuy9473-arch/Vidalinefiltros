import React, { useEffect, useState } from 'react';
import { useLogin } from '../../hooks/useLogin';
import loginBg from '../../assets/login-bg.jpg';
import mTop from '../../assets/login-m-top.jpg';
import mBottom from '../../assets/login-m-bottom.jpg';
import mEdgeL from '../../assets/login-m-edge-l.jpg';
import mEdgeR from '../../assets/login-m-edge-r.jpg';
import { LoginForm } from './LoginForm';
import './login.css';

const IMG_W = 1768;
const IMG_H = 889;
const DESKTOP_MIN = 900;
const M_W = 612; // largura (px da imagem) do recorte usado no telemóvel
const M_MAX = 540; // largura máxima em px no ecrã

/** Escala "cover" do cenário e se o ecrã é largo o bastante para o layout da imagem. */
function useStageScale() {
  const read = () => ({
    desktop: window.innerWidth >= DESKTOP_MIN,
    scale: Math.max(window.innerWidth / IMG_W, window.innerHeight / IMG_H),
    mobileScale: Math.min(window.innerWidth - 24, M_MAX) / M_W,
  });
  const [state, setState] = useState(read);
  useEffect(() => {
    const onResize = () => setState(read());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return state;
}

export const LoginExperience: React.FC<{ initialError?: string | null }> = ({ initialError = null }) => {
  const { status, error, submit } = useLogin(initialError);
  const { desktop, scale, mobileScale } = useStageScale();

  if (!desktop) {
    const vars = {
      '--s': mobileScale,
      '--m-edge-l': `url(${mEdgeL})`,
      '--m-edge-r': `url(${mEdgeR})`,
    } as React.CSSProperties;
    return (
      <div className="vlx-root vlx-m-root">
        <div className="vlx-m" style={vars}>
          <img className="vlx-m-top" src={mTop} alt="" draggable={false} />
          <section className="vlx-m-body" aria-label="Início de sessão">
            <LoginForm status={status} error={error} onSubmit={submit} />
          </section>
          <img className="vlx-m-bottom" src={mBottom} alt="" draggable={false} />
        </div>
      </div>
    );
  }

  return (
    <div className="vlx-root">
      <div className="vlx-canvas" style={{ transform: `scale(${scale}) translate(-50%, -50%)` }}>
        <img className="vlx-bg" src={loginBg} alt="" draggable={false} />
        <div className="vlx-cover" aria-hidden="true" />
        <section className="vlx-form-area vlx-native" aria-label="Início de sessão">
          <LoginForm status={status} error={error} onSubmit={submit} />
        </section>
      </div>
    </div>
  );
};
