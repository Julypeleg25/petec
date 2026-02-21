export interface SearchBarProps {
    placeholder?: string;
    state?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setState?: React.SetStateAction<any>;
    onEnter?: (e: any) => void;
}
