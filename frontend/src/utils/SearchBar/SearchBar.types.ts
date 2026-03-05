export interface SearchBarProps {
    placeholder?: string;
    state?: string | null;
    setState?: (val: string) => void;
    onEnter?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}
