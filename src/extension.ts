import * as vscode from 'vscode';
import {
  DefinitionProvider,
  LocationLink,
  Position,
  SymbolInformation,
  SymbolKind,
  TextDocument,
} from 'vscode';

const FREQUENT_THRESHOLD = 5;

const symbolDefinitionProvider: DefinitionProvider = {
  provideDefinition: async (
    document: TextDocument,
    position: Position
  ): Promise<LocationLink[] | undefined> => {
    const range = document.getWordRangeAtPosition(position);
    const query = document.getText(range);
    if (query.length === 0) {
      return;
    }

    const symbols = (await vscode.commands.executeCommand(
      'vscode.executeWorkspaceSymbolProvider',
      query
    )) as SymbolInformation[];

    const filteredSymbols = symbols.filter(
      ({ kind, name }) => kind === SymbolKind.Method && name.includes(query)
    );
    if (filteredSymbols.length > FREQUENT_THRESHOLD) {
      return;
    }

    return filteredSymbols.map(({ location: { uri, range } }) => ({
      targetRange: range,
      targetUri: uri,
    }));
  },
};

export function activate(context: vscode.ExtensionContext) {
  const config = vscode.workspace.getConfiguration('symbolDefinition');
  if (config.enabledLanguages.length === 0) {
    return;
  }

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      config.enabledLanguages,
      symbolDefinitionProvider
    )
  );
}

export function deactivate() {}
