import Svg, { SvgProps, Path } from "react-native-svg";

export default function ArrowUpIcon(props: SvgProps) {
  return (
    <Svg fill="none" {...props}>
      <Path
        strokeLinecap="square"
        strokeWidth={1.5}
        d="M6 15.351V1.693m0 0L1.122 6.815M6 1.693l4.878 5.122"
      />
    </Svg>
  );
}
