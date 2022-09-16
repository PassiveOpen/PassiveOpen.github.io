Sniplet / Notes for myself

# Regex

| item | action       |
| :--: | :----------- |
|  a?  | zero or one  |
| a\*  | zero or more |
|  a+  | one or more  |

# .toTitleCase()

```TS
interface String {
  toTitleCase(): string;
}

String.prototype.toTitleCase = function ():string {
      return this.replace(/\b\w/g, (first) => first.toLocaleUpperCase());
};
```

# VS code

## Folding

|     item      | action                                                       |
| :-----------: | :----------------------------------------------------------- |
| Ctrl+Shift+[  | Fold (collapse) region editor.fold                           |
| Ctrl+Shift+]  | Unfold (uncollapse) region editor.unfold                     |
| Ctrl+K Ctrl+[ | Fold (collapse) all subregions editor.foldRecursively        |
| Ctrl+K Ctrl+] | Unfold (uncollapse) all subregions editor. unfoldRecursively |
| Ctrl+K Ctrl+0 | Fold (collapse) all regions editor.foldAll                   |
| Ctrl+K Ctrl+J | Unfold (uncollapse) all regions                              |
