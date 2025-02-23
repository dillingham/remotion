import React, {useMemo, useState} from 'react';
import type {z} from 'zod';
import {useZodIfPossible} from '../../get-zod-if-possible';
import {deepEqual} from './deep-equal';
import {Fieldset} from './Fieldset';
import {useLocalState} from './local-state';
import {SchemaLabel} from './SchemaLabel';
import {SchemaArrayItemSeparationLine} from './SchemaSeparationLine';
import {SchemaVerticalGuide} from './SchemaVerticalGuide';
import type {JSONPath} from './zod-types';
import {ZodArrayItemEditor} from './ZodArrayItemEditor';
import {ZodFieldValidation} from './ZodFieldValidation';
import type {UpdaterFunction} from './ZodSwitch';

export const ZodArrayEditor: React.FC<{
	schema: z.ZodTypeAny;
	jsonPath: JSONPath;
	value: unknown[];
	defaultValue: unknown[];
	setValue: UpdaterFunction<unknown[]>;
	onSave: UpdaterFunction<unknown[]>;
	showSaveButton: boolean;
	onRemove: null | (() => void);
	saving: boolean;
	saveDisabledByParent: boolean;
	mayPad: boolean;
}> = ({
	schema,
	jsonPath,
	setValue,
	defaultValue,
	value,
	onSave,
	showSaveButton,
	onRemove,
	saving,
	saveDisabledByParent,
	mayPad,
}) => {
	const {localValue, onChange, RevisionContextProvider, reset} = useLocalState({
		value,
		schema,
		setValue,
		defaultValue,
	});

	const [expanded, setExpanded] = useState(true);

	const def = schema._def as z.ZodArrayDef;

	const suffix = useMemo(() => {
		return expanded ? ' [' : ' [...] ';
	}, [expanded]);
	const z = useZodIfPossible();
	if (!z) {
		throw new Error('expected zod');
	}

	const typeName = def.typeName as z.ZodFirstPartyTypeKind;
	if (typeName !== z.ZodFirstPartyTypeKind.ZodArray) {
		throw new Error('expected object');
	}

	const isDefaultValue = useMemo(() => {
		return deepEqual(localValue.value, defaultValue);
	}, [defaultValue, localValue]);

	return (
		<Fieldset shouldPad={mayPad} success={localValue.zodValidation.success}>
			<div
				style={{
					display: 'flex',
					flexDirection: 'row',
				}}
			>
				<SchemaLabel
					onReset={reset}
					isDefaultValue={isDefaultValue}
					jsonPath={jsonPath}
					onRemove={onRemove}
					suffix={suffix}
					onSave={() => {
						onSave(() => localValue.value, false, false);
					}}
					saveDisabledByParent={saveDisabledByParent}
					saving={saving}
					showSaveButton={showSaveButton}
					valid={localValue.zodValidation.success}
					handleClick={() => setExpanded(!expanded)}
				/>
			</div>

			{expanded ? (
				<RevisionContextProvider>
					<SchemaVerticalGuide isRoot={false}>
						{localValue.value.map((child, i) => {
							return (
								// eslint-disable-next-line react/no-array-index-key
								<React.Fragment key={`${i}${localValue.keyStabilityRevision}`}>
									<ZodArrayItemEditor
										onChange={onChange}
										value={child}
										def={def}
										index={i}
										jsonPath={jsonPath}
										defaultValue={defaultValue[i]}
										onSave={onSave}
										showSaveButton={showSaveButton}
										saving={saving}
										saveDisabledByParent={saveDisabledByParent}
										mayPad={mayPad}
									/>
									<SchemaArrayItemSeparationLine
										schema={schema}
										index={i}
										onChange={onChange}
										isLast={i === localValue.value.length - 1}
									/>
								</React.Fragment>
							);
						})}
					</SchemaVerticalGuide>
				</RevisionContextProvider>
			) : null}
			<ZodFieldValidation path={jsonPath} localValue={localValue} />
		</Fieldset>
	);
};
