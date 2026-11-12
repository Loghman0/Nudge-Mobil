import type {TextStyle} from 'react-native';
// Runtime is light-only. Dark tokens are retained for a future, separately reviewed release.
const palette={
 mist:'#edf2f7',paper:'#f9fbfd',paleBlue:'#e1eaf4',ink:'#253348',slate:'#536479',line:'#becbda',blue:'#355db9',
 night:'#152234',deep:'#203147',deepBlue:'#283c54',bright:'#e9eef5',soft:'#bac9db',darkLine:'#4a5e76',lightBlue:'#a6bff0',white:'#ffffff',scrim:'rgba(0,0,0,0.5)',
};
export const themes={
 light:{surface:palette.mist,card:palette.paper,pressed:palette.paleBlue,text:palette.ink,muted:palette.slate,line:palette.line,controlLine:palette.slate,accent:palette.blue,onAccent:palette.paper,selection:palette.paleBlue,scrim:palette.scrim},
 dark:{surface:palette.night,card:palette.deep,pressed:palette.deepBlue,text:palette.bright,muted:palette.soft,line:palette.darkLine,controlLine:palette.soft,accent:palette.lightBlue,onAccent:palette.night,selection:palette.deepBlue,scrim:palette.scrim},
};
export type Theme=typeof themes.light;
export const layout={space:{xs:4,sm:8,md:16,lg:24,xl:32,xxl:48},radius:{small:12,card:24,pill:999},target:48,maxWidth:560};
// Derived from the existing Nudge screens; one ramp for preview and signed-in UI.
export const typography={
 body:{fontSize:16,lineHeight:25},button:{fontSize:16,lineHeight:24,fontWeight:'600'},
 caption:{fontSize:14,lineHeight:22},tab:{fontSize:13,lineHeight:20},
 title:{fontSize:22,lineHeight:32,fontWeight:'600'},question:{fontSize:22,lineHeight:30,fontWeight:'600',letterSpacing:-0.4},
 hero:{fontSize:30,lineHeight:40,fontWeight:'700',letterSpacing:-0.5},
 intro:{fontSize:18,lineHeight:28},cardTitle:{fontSize:18,lineHeight:27,fontWeight:'600'},
 brand:{fontSize:22,lineHeight:30,fontWeight:'700',letterSpacing:-0.8},check:{fontSize:20,lineHeight:24},
} as const satisfies Record<string,TextStyle>;
