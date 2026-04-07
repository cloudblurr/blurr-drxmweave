export type ThemePreset = {
  id: string;
  name: string;
  colors: {
    bg: string;
    surface: string;
    primary: string;
    accent: string;
    text: string;
    textSecondary: string;
  };
};

export const DEFAULT_THEME_ID = 'cosmic-wave';

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'cosmic-wave',
    name: 'Cosmic Wave',
    colors: {
      bg: 'linear-gradient(130deg, #040206 0%, #1b0831 32%, #2b1048 50%, #0b2e73 72%, #ff6a2a 100%)',
      surface: '#14081f',
      primary: '#ff7b2f',
      accent: '#3f7dff',
      text: '#f7ecff',
      textSecondary: '#c9b8da'
    }
  },
  {
    id: 'event-horizon',
    name: 'Event Horizon',
    colors: {
      bg: 'linear-gradient(145deg, #020203 0%, #11001f 30%, #2a0d3f 55%, #1d3d8b 78%, #ff8a36 100%)',
      surface: '#130718',
      primary: '#ff9448',
      accent: '#4b8dff',
      text: '#f5e9ff',
      textSecondary: '#bda7cf'
    }
  },
  {
    id: 'nebula-drift',
    name: 'Nebula Drift',
    colors: {
      bg: 'linear-gradient(120deg, #030305 0%, #100220 25%, #1e0635 48%, #173875 72%, #ff6f1f 100%)',
      surface: '#170a22',
      primary: '#f67a2d',
      accent: '#5ea2ff',
      text: '#f7edff',
      textSecondary: '#cbb9db'
    }
  },
  {
    id: 'default-dark',
    name: 'Default Dark',
    colors: {
      bg: '#000000',
      surface: '#0f172a',
      primary: '#0ea5e9',
      accent: '#22d3ee',
      text: '#ffffff',
      textSecondary: '#cbd5e1'
    }
  },
  {
    id: 'default-light',
    name: 'Default Light',
    colors: {
      bg: '#f8fafc',
      surface: '#e2e8f0',
      primary: '#0ea5e9',
      accent: '#22d3ee',
      text: '#0f172a',
      textSecondary: '#475569'
    }
  },
  {
    id: 'ember-earth-gradient',
    name: 'Ember Earth Gradient',
    colors: {
      bg: 'linear-gradient(90deg, hsla(23,41%,9%,1) 0%, hsla(18,16%,53%,1) 100%)',
      surface: '#1F140D',
      primary: '#9B8074',
      accent: '#735345',
      text: '#e6dcd6',
      textSecondary: '#9B8074'
    }
  },
  {
    id: 'violet-ember-gradient',
    name: 'Violet Ember Gradient',
    colors: {
      bg: 'linear-gradient(90deg, hsla(296,100%,6%,1) 0%, hsla(5,90%,24%,1) 100%)',
      surface: '#1F0021',
      primary: '#751006',
      accent: '#c11e38',
      text: '#f2dce6',
      textSecondary: '#751006'
    }
  },
  {
    id: 'midnight-green-gradient',
    name: 'Midnight Green Gradient',
    colors: {
      bg: 'linear-gradient(90deg, hsla(0,0%,5%,1) 0%, hsla(126,82%,33%,1) 100%)',
      surface: '#0C0C0C',
      primary: '#0F971C',
      accent: '#0F971C',
      text: '#dfeee0',
      textSecondary: '#0F971C'
    }
  },
  {
    id: 'rose-ember-gradient',
    name: 'Rose Ember Gradient',
    colors: {
      bg: 'linear-gradient(90deg, hsla(350,73%,44%,1) 0%, hsla(274,65%,12%,1) 100%)',
      surface: '#220B34',
      primary: '#c11e38',
      accent: '#220b34',
      text: '#ffd6e0',
      textSecondary: '#c11e38'
    }
  },
  {
    id: 'tri-shift-gradient',
    name: 'Tri-Shift Gradient',
    colors: {
      bg: 'linear-gradient(90deg, hsla(154,53%,82%,1) 0%, hsla(24,88%,65%,1) 50%, hsla(216,56%,16%,1) 100%)',
      surface: '#B8E9D4',
      primary: '#F4985A',
      accent: '#16425a',
      text: '#072227',
      textSecondary: '#F4985A'
    }
  },
  {
    id: 'deep-ocean-gradient',
    name: 'Deep Ocean Gradient',
    colors: {
      bg: 'linear-gradient(90deg, hsla(205,46%,10%,1) 0%, hsla(191,28%,23%,1) 50%, hsla(207,41%,27%,1) 100%)',
      surface: '#0E1C26',
      primary: '#2A454B',
      accent: '#2A454B',
      text: '#bcdfe8',
      textSecondary: '#2A454B'
    }
  },
  {
    id: 'steel-blue-gradient',
    name: 'Steel Blue Gradient',
    colors: {
      bg: 'linear-gradient(90deg, hsla(213,77%,14%,1) 0%, hsla(202,27%,45%,1) 100%)',
      surface: '#08203E',
      primary: '#557C93',
      accent: '#557C93',
      text: '#dcecf6',
      textSecondary: '#557C93'
    }
  },
  {
    id: 'sapphire-gradient',
    name: 'Sapphire Gradient',
    colors: {
      bg: 'linear-gradient(90deg, hsla(221,45%,73%,1) 0%, hsla(220,78%,29%,1) 100%)',
      surface: '#9BAFD9',
      primary: '#103783',
      accent: '#103783',
      text: '#081230',
      textSecondary: '#103783'
    }
  }
];

export const getThemePreset = (id?: string) => {
  if (!id) return THEME_PRESETS[0];
  if (id === 'dark') {
    return THEME_PRESETS.find(theme => theme.id === DEFAULT_THEME_ID) || THEME_PRESETS[0];
  }
  if (id === 'light') {
    return THEME_PRESETS.find(theme => theme.id === 'default-light') || THEME_PRESETS[0];
  }
  return THEME_PRESETS.find(theme => theme.id === id) || THEME_PRESETS[0];
};
