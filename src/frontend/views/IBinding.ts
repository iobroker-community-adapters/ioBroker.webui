export interface IBinding {
    type: 'style' | 'attribute';
    objectId: string;
    condition?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'consist' | 'notConsist' | 'exist' | 'notExist'
    compareValue?: any
    trueValue?: any;
    falseValue?: any;
    invert?: boolean;
    converter?: any //todo
}