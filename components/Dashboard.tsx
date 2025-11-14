import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
    UsuarioTecnico, 
    VisitaTecnica, 
    AnotacaoTecnica, 
    VisitStatus, 
    AnnotationType,
    AIPrompt,
    Cliente,
    UserRole
} from '../types';
import { 
    Button, 
    Input, 
    Modal, 
    Card, 
    LoadingSpinner, 
    Textarea, 
    Select 
} from './ui';
import { 
    PlusIcon, 
    LogOutIcon, 
    EditIcon, 
    TrashIcon, 
    ChevronLeftIcon,
    FileTextIcon,
    CheckCircleIcon,
    XCircleIcon,
    MicIcon,
    SparklesIcon,
    SettingsIcon,
    EyeIcon,
    EyeOffIcon,
    UsersIcon,
    SaveIcon,
} from './icons';
import { generateReportSummary, refineTranscription, testApiKey, transcribeAudio } from '../services/geminiService';
import * as api from '../services/api';
import { logoAppBase64 } from '../assets';


const DEFAULT_AI_PROMPT_CONTENT = `Você é um Especialista de Suporte de TI Sênior. Sua tarefa é reescrever o texto a seguir, que é uma transcrição bruta ou uma série de anotações de um técnico, em um formato profissional, claro, organizado e ideal para o entendimento de um cliente final. Consolide os pontos, mantenha os fatos técnicos, mas melhore a gramática e a estrutura. Texto Bruto: "[TEXTO_BRUTO_AQUI]"`;


// --- Helper Functions ---
const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64data = reader.result?.toString().split(',')[1];
            if (base64data) {
                resolve(base64data);
            } else {
                reject(new Error("Falha ao converter blob para base64"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

// --- Sub-Components ---

type DbStatus = 'online' | 'offline' | 'checking';

const Header: React.FC<{
    user: UsuarioTecnico;
    onLogout: () => void;
    onNavigate: (view: 'dashboard' | 'settings') => void;
    dbStatus: DbStatus;
}> = ({ user, onLogout, onNavigate, dbStatus }) => {
    const statusIndicator: Record<DbStatus, { color: string; text: string }> = {
        online: { color: 'bg-success', text: 'Online' },
        offline: { color: 'bg-danger', text: 'Offline' },
        checking: { color: 'bg-yellow-500 animate-pulse', text: 'Verificando...' }
    };
    const currentStatus = statusIndicator[dbStatus];

    return (
        <header className="bg-secondary p-4 flex justify-between items-center border-b border-border">
            <div className="flex items-center gap-4">
                <img src={logoAppBase64} alt="Inside Notes Logo" className="w-10 h-10 rounded-md" />
                <div>
                    <h1 className="text-xl font-bold text-accent">Inside Notes</h1>
                    <p className="text-sm text-text-secondary">Bem-vindo, {user.nome}</p>
                    <div className="flex items-center gap-2 mt-1" title={`Status do Servidor: ${currentStatus.text}`}>
                        <span className={`w-3 h-3 rounded-full ${currentStatus.color}`}></span>
                        <span className="text-xs text-text-secondary">
                            Servidor: {currentStatus.text}
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {user.role === 'ADM' && (
                    <Button onClick={() => onNavigate('settings')} variant="secondary" aria-label="Configurações">
                        <SettingsIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Configurações</span>
                    </Button>
                )}
                <Button onClick={onLogout} variant="secondary" aria-label="Sair">
                    <LogOutIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Sair</span>
                </Button>
            </div>
        </header>
    );
};


const VisitCard: React.FC<{ visit: VisitaTecnica; onSelect: () => void }> = ({ visit, onSelect }) => {
    const statusColors: Record<VisitStatus, string> = {
        [VisitStatus.Agendada]: 'bg-blue-500',
        [VisitStatus.Aberta]: 'bg-gray-500',
        [VisitStatus.EmAndamento]: 'bg-warning',
        [VisitStatus.Concluida]: 'bg-success',
    };
    return (
        <Card className="mb-4 hover:border-accent transition-colors duration-200 cursor-pointer" onClick={onSelect}>
            <div className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-text-primary">{visit.cliente}</h3>
                        <p className="text-sm text-text-secondary">{visit.descricao_extra}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full text-white ${statusColors[visit.status]}`}>{visit.status}</span>
                </div>
                <div className="mt-4 text-sm text-text-secondary">
                    <p>Técnico: {visit.tecnico?.nome}</p>
                    <p>Data: {new Date(visit.data_inicio).toLocaleString('pt-BR')}</p>
                </div>
            </div>
        </Card>
    );
};


const AnnotationSection: React.FC<{ title: string; type: AnnotationType; annotations: AnotacaoTecnica[]; onAdd: (type: AnnotationType) => void; onEdit: (annotation: AnotacaoTecnica) => void; }> = ({ title, type, annotations, onAdd, onEdit }) => (
    <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
            <h4 className="text-lg font-bold text-accent capitalize">{title}</h4>
            <Button variant="secondary" onClick={() => onAdd(type)}><PlusIcon className="w-4 h-4 mr-1"/> Adicionar</Button>
        </div>
        <div className="space-y-3">
            {annotations.length > 0 ? (
                annotations.map(note => (
                    <Card key={note.id} className="p-3 bg-primary group">
                        <div className="flex justify-between items-start">
                            <p className="text-sm text-text-primary whitespace-pre-wrap flex-1">{note.descricao}</p>
                            <Button variant="secondary" onClick={() => onEdit(note)} className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 px-2 py-1">
                                <EditIcon className="w-4 h-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-text-secondary mt-2 text-right">{new Date(note.data_hora).toLocaleString('pt-BR')}</p>
                    </Card>
                ))
            ) : (
                <p className="text-sm text-text-secondary italic">Nenhuma anotação.</p>
            )}
        </div>
    </div>
);


const VisitDetails: React.FC<{ visit: VisitaTecnica; annotations: AnotacaoTecnica[]; onBack: () => void; onAddAnnotation: (type: AnnotationType) => void; onEditAnnotation: (annotation: AnotacaoTecnica) => void; onGenerateReport: () => void; isGeneratingReport: boolean; }> = ({ visit, annotations, onBack, onAddAnnotation, onEditAnnotation, onGenerateReport, isGeneratingReport }) => {
    const groupedAnnotations = Object.values(AnnotationType).reduce((acc, type) => {
        acc[type] = annotations.filter(a => a.tipo === type);
        return acc;
    }, {} as Record<AnnotationType, AnotacaoTecnica[]>);

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <Button variant="secondary" onClick={onBack}><ChevronLeftIcon className="w-5 h-5 mr-1"/> Voltar</Button>
                 <Button onClick={onGenerateReport} disabled={isGeneratingReport}>
                    {isGeneratingReport ? <LoadingSpinner /> : <><FileTextIcon className="w-5 h-5 mr-2" /> Gerar Laudo</>}
                </Button>
            </div>
            
            <Card className="p-6 mb-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-text-primary">{visit.cliente}</h2>
                     <span className={`px-3 py-1 text-sm font-bold rounded-full text-white ${ { [VisitStatus.Agendada]: 'bg-blue-500', [VisitStatus.Aberta]: 'bg-gray-500', [VisitStatus.EmAndamento]: 'bg-warning', [VisitStatus.Concluida]: 'bg-success' }[visit.status]}`}>{visit.status}</span>
                </div>
                <p className="text-text-secondary mb-4">{visit.descricao_extra}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p><strong className="text-text-secondary">Técnico:</strong> {visit.tecnico?.nome}</p>
                    <p><strong className="text-text-secondary">Data de Início:</strong> {new Date(visit.data_inicio).toLocaleString('pt-BR')}</p>
                    <p><strong className="text-text-secondary">Criado em:</strong> {new Date(visit.criado_em).toLocaleString('pt-BR')}</p>
                    {visit.laudo_final && <p><strong className="text-text-secondary">Laudo:</strong> <a href={visit.laudo_final} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">Visualizar</a></p>}
                </div>
            </Card>

            <h3 className="text-xl font-bold mb-4 text-text-primary">Anotações Técnicas</h3>
            {Object.values(AnnotationType).map(type => (
                 <AnnotationSection key={type} title={type} type={type} annotations={groupedAnnotations[type]} onAdd={onAddAnnotation} onEdit={onEditAnnotation} />
            ))}
        </div>
    );
};

const AnnotationModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (annotation: Omit<AnotacaoTecnica, 'id' | 'visita_id' | 'data_hora'>, isDraft: boolean) => void;
    annotationType: AnnotationType | null;
    existingAnnotation: AnotacaoTecnica | null;
    aiPrompts: AIPrompt[];
    setNotification: (notification: { type: 'success' | 'error', message: string } | null) => void;
}> = ({ isOpen, onClose, onSave, annotationType, existingAnnotation, aiPrompts, setNotification }) => {
    const [fragments, setFragments] = useState<string[]>([]);
    const [currentFragment, setCurrentFragment] = useState('');
    const [processingState, setProcessingState] = useState<'idle' | 'processing' | 'reviewing'>('idle');
    const [showPromptSelection, setShowPromptSelection] = useState(false);
    const [finalText, setFinalText] = useState<{ raw: string; refined: string } | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        if (isOpen) {
            setFragments(existingAnnotation?.fragments || []);
        } else {
            setFragments([]);
            setCurrentFragment('');
            setProcessingState('idle');
            setFinalText(null);
            setIsRecording(false);
            setIsTranscribing(false);
            setShowPromptSelection(false);
            mediaRecorderRef.current = null;
        }
    }, [isOpen, existingAnnotation]);

    const handleAddFragment = () => {
        if (currentFragment.trim()) {
            setFragments(prev => [...prev, currentFragment.trim()]);
            setCurrentFragment('');
        }
    };
    
    const handleDeleteFragment = (index: number) => {
        setFragments(prev => prev.filter((_, i) => i !== index));
    };

    const handleFinalizeClick = () => {
        if (fragments.length === 0) return;
        if (aiPrompts.length > 1) {
            setShowPromptSelection(true);
        } else {
            handleFinalize(aiPrompts[0]);
        }
    };

    const handleFinalize = async (prompt?: AIPrompt) => {
        if (!prompt) {
            setNotification({ type: 'error', message: 'Nenhum prompt de IA selecionado.' });
            return;
        }
        setShowPromptSelection(false);
        setProcessingState('processing');
        const rawText = "- " + fragments.join('\n\n- ');
        try {
            const refinedText = await refineTranscription(rawText, prompt.content);
            setFinalText({ raw: rawText, refined: refinedText });
            setProcessingState('reviewing');
        } catch (error) {
            console.error("Falha ao refinar o texto com IA", error);
            setNotification({ type: 'error', message: 'Falha ao refinar texto com IA.' });
            setProcessingState('idle');
        }
    };

    const handleSaveFinal = () => {
        if (finalText && annotationType) {
            onSave({ tipo: annotationType, descricao: finalText.refined, fragments }, false);
            onClose();
        }
    };
    
    const handleSaveDraft = () => {
        if (fragments.length === 0 && !existingAnnotation) return;
        if (annotationType) {
            const rawText = "- " + fragments.join('\n\n- ');
            onSave({ tipo: annotationType, descricao: rawText, fragments }, true);
            onClose();
        }
    };

    const handleToggleRecording = async () => {
        if (isRecording) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
        } else {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    audioChunksRef.current.push(event.data);
                };

                mediaRecorderRef.current.onstop = async () => {
                    setIsTranscribing(true);
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    try {
                        const base64Audio = await blobToBase64(audioBlob);
                        const transcribedText = await transcribeAudio(base64Audio, 'audio/webm');
                        if (transcribedText) {
                             setFragments(prev => [...prev, transcribedText]);
                             setNotification({ type: 'success', message: 'Áudio transcrito e adicionado!' });
                        } else {
                            throw new Error("Transcrição retornou vazia.");
                        }
                    } catch (error) {
                        console.error("Falha ao transcrever áudio", error);
                        setNotification({ type: 'error', message: 'Falha ao transcrever o áudio.' });
                    } finally {
                        setIsTranscribing(false);
                        stream.getTracks().forEach(track => track.stop());
                    }
                };
                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error("Erro ao acessar o microfone", err);
                 if (err instanceof Error && err.name === 'NotFoundError') {
                    setNotification({ type: 'error', message: 'Nenhum microfone encontrado.' });
                } else {
                    setNotification({ type: 'error', message: 'Não foi possível acessar o microfone.' });
                }
            }
        }
    };


    const renderContent = () => {
        if (showPromptSelection) {
            return (
                 <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-text-primary">Escolha o Estilo do Texto Final</h3>
                    <p className="text-sm text-text-secondary">Selecione o prompt que a IA usará para refinar suas anotações.</p>
                    <div className="grid grid-cols-1 gap-2 pt-2">
                         {aiPrompts.map((prompt) => (
                            <Button key={prompt.name} onClick={() => handleFinalize(prompt)} variant="secondary">
                                {prompt.name}
                            </Button>
                         ))}
                    </div>
                     <div className="flex justify-end pt-4">
                        <Button variant="secondary" onClick={() => setShowPromptSelection(false)}>Cancelar</Button>
                    </div>
                </div>
            )
        }
        switch (processingState) {
            case 'processing':
                return (
                    <div className="flex flex-col items-center justify-center p-8 space-y-4">
                        <LoadingSpinner />
                        <p className="text-text-secondary">Consolidando e refinando com IA...</p>
                    </div>
                );
            case 'reviewing':
                return finalText && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-text-primary text-sm font-bold mb-2">Texto Consolidado (Bruto)</label>
                            <Card className="p-3 bg-primary max-h-32 overflow-y-auto">
                                <p className="text-sm text-text-secondary italic whitespace-pre-wrap">{finalText.raw}</p>
                            </Card>
                        </div>
                        <div>
                            <label className="block text-text-primary text-sm font-bold mb-2">
                                <SparklesIcon className="w-4 h-4 inline-block mr-2 text-accent" />
                                Sugestão Final (IA)
                            </label>
                            <Textarea 
                                rows={8}
                                value={finalText.refined}
                                onChange={(e) => setFinalText({...finalText, refined: e.target.value})}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="secondary" onClick={() => setProcessingState('idle')}>Voltar à Edição</Button>
                            <Button onClick={handleSaveFinal}>Salvar Anotação Final</Button>
                        </div>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-text-primary text-sm font-bold mb-1">Pedaços da Anotação</label>
                            <Card className="p-3 bg-primary space-y-2 max-h-40 overflow-y-auto">
                                {fragments.length > 0 ? fragments.map((frag, index) => (
                                    <div key={index} className="flex justify-between items-center bg-secondary p-2 rounded">
                                        <p className="text-sm text-text-primary flex-1">{frag}</p>
                                        <button onClick={() => handleDeleteFragment(index)} className="text-danger hover:text-red-400 ml-2">
                                            <TrashIcon className="w-4 h-4"/>
                                        </button>
                                    </div>
                                )) : <p className="text-sm text-text-secondary italic">Adicione a primeira parte abaixo...</p>}
                            </Card>
                        </div>
                        <div>
                            <label className="block text-text-primary text-sm font-bold mb-2">Novo Pedaço</label>
                            <Textarea value={currentFragment} onChange={(e) => setCurrentFragment(e.target.value)} placeholder="Digite ou use a voz para adicionar uma parte da anotação."/>
                             <div className="flex gap-2 mt-2">
                                <Button variant="secondary" onClick={handleAddFragment} className="w-full" disabled={!currentFragment.trim()}>
                                    <PlusIcon className="w-5 h-5 mr-2" />
                                    Adicionar
                                </Button>
                                 <Button 
                                    variant={isRecording ? 'danger' : 'secondary'} 
                                    onClick={handleToggleRecording} 
                                    className="w-full"
                                    disabled={isTranscribing}
                                >
                                    {isTranscribing ? <LoadingSpinner/> : <MicIcon className={`w-5 h-5 mr-2 ${isRecording ? 'animate-pulse' : ''}`} />}
                                    {isRecording ? 'Parar' : isTranscribing ? 'Transcrevendo...' : 'Voz'}
                                </Button>
                             </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t border-border">
                            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                             <Button variant="secondary" onClick={handleSaveDraft}>
                                Salvar Rascunho
                            </Button>
                            <Button onClick={handleFinalizeClick} disabled={fragments.length === 0}>
                                <SparklesIcon className="w-5 h-5 mr-2" />
                                Finalizar e Refinar
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${existingAnnotation ? 'Editar' : 'Nova'} Anotação de ${annotationType}`}>
            {renderContent()}
        </Modal>
    );
};

const Settings: React.FC<{
    onBack: () => void; 
    prompts: AIPrompt[]; 
    setPrompts: (prompts: AIPrompt[]) => void;
    setNotification: (notification: { type: 'success' | 'error', message: string } | null) => void;
    users: UsuarioTecnico[];
    onUsersUpdate: (users: UsuarioTecnico[]) => void;
}> = ({ onBack, prompts, setPrompts, setNotification, users, onUsersUpdate }) => {
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [activeTab, setActiveTab] = useState<'api' | 'users'>('api');

    // State for user management
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UsuarioTecnico | null>(null);
    
    const handleTestApi = async () => {
        setTestStatus('testing');
        const isValid = await testApiKey();
        setTestStatus(isValid ? 'success' : 'error');
        setNotification({
            type: isValid ? 'success' : 'error',
            message: isValid ? 'Conexão com a API do Gemini bem-sucedida!' : 'Falha na conexão com a API do Gemini. Verifique a configuração do ambiente.',
        });
    };

    const handleAddPrompt = () => {
        setPrompts([...prompts, { name: "Novo Prompt", content: "Escreva o conteúdo do prompt aqui..." }]);
    };

    const handleUpdatePrompt = (index: number, field: 'name' | 'content', value: string) => {
        const newPrompts = [...prompts];
        newPrompts[index] = { ...newPrompts[index], [field]: value };
        setPrompts(newPrompts);
    };
    
    const handleDeletePrompt = (index: number) => {
        setPrompts(prompts.filter((_, i) => i !== index));
    };

    const handleOpenUserModal = (user: UsuarioTecnico | null) => {
        setEditingUser(user);
        setIsUserModalOpen(true);
    };

    const handleSaveUser = async (userData: Omit<UsuarioTecnico, 'id'> | UsuarioTecnico) => {
        try {
            let updatedUsers;
            if ('id' in userData) {
                const updatedUser = await api.updateUser(userData);
                updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
            } else {
                const newUser = await api.createUser(userData);
                updatedUsers = [...users, newUser];
            }
            onUsersUpdate(updatedUsers);
            setNotification({ type: 'success', message: 'Usuário salvo com sucesso!' });
            setIsUserModalOpen(false);
        } catch (error) {
            console.error("Failed to save user", error);
            setNotification({ type: 'error', message: 'Falha ao salvar usuário.' });
        }
    };

    const TabButton: React.FC<{ tabName: 'api' | 'users'; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === tabName ? 'bg-accent text-white' : 'bg-secondary hover:bg-border text-text-secondary'}`}
        >
            {icon} {label}
        </button>
    );

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <Button variant="secondary" onClick={onBack}><ChevronLeftIcon className="w-5 h-5 mr-1"/> Voltar ao Dashboard</Button>
            </div>
            <h2 className="text-2xl font-bold mb-6">Configurações de Administrador</h2>

            <div className="flex gap-2 mb-6 border-b border-border pb-4">
                <TabButton tabName="api" label="API & Prompts" icon={<SparklesIcon className="w-5 h-5"/>} />
                <TabButton tabName="users" label="Gerenciar Usuários" icon={<UsersIcon className="w-5 h-5"/>} />
            </div>

            {activeTab === 'api' && (
                <>
                    <Card className="p-6 mb-6">
                        <h3 className="text-xl font-bold text-accent mb-4">API do Gemini</h3>
                        <p className="text-sm text-text-secondary mb-4">
                            A aplicação está configurada para usar uma chave de API do Google Gemini fornecida através de variáveis de ambiente no servidor. Você pode testar a conexão abaixo.
                        </p>
                        <div className="flex items-center gap-4">
                            <Button onClick={handleTestApi} disabled={testStatus === 'testing'}>
                                {testStatus === 'testing' ? <LoadingSpinner /> : 'Testar Conexão com API'}
                            </Button>
                            {testStatus === 'success' && <p className="text-success text-sm mt-2 flex items-center gap-2"><CheckCircleIcon className="w-4 h-4"/> Conexão bem-sucedida!</p>}
                            {testStatus === 'error' && <p className="text-danger text-sm mt-2 flex items-center gap-2"><XCircleIcon className="w-4 h-4"/> Falha na conexão.</p>}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="text-xl font-bold text-accent mb-4">Prompts da IA para Refinamento</h3>
                        <p className="text-sm text-text-secondary mb-4">Gerencie os prompts usados para refinar as anotações. Use `[TEXTO_BRUTO_AQUI]` como placeholder.</p>
                        <div className="space-y-4">
                            {prompts.map((prompt, index) => (
                                <div key={index} className="bg-primary p-4 rounded-md border border-border">
                                    <label className="block text-text-primary text-sm font-bold mb-2">Nome do Prompt</label>
                                    <Input
                                        value={prompt.name}
                                        onChange={(e) => handleUpdatePrompt(index, 'name', e.target.value)}
                                        className="mb-3"
                                    />
                                    <label className="block text-text-primary text-sm font-bold mb-2">Conteúdo do Prompt</label>
                                    <div className="flex items-start gap-2">
                                        <Textarea 
                                            rows={4} 
                                            value={prompt.content} 
                                            onChange={(e) => handleUpdatePrompt(index, 'content', e.target.value)}
                                            className="flex-grow"
                                        />
                                        <Button variant="danger" onClick={() => handleDeletePrompt(index)} aria-label="Excluir prompt">
                                            <TrashIcon className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleAddPrompt} className="mt-4"><PlusIcon className="w-5 h-5 mr-2" /> Novo Prompt</Button>
                    </Card>
                </>
            )}

            {activeTab === 'users' && (
                <Card className="p-6">
                     <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-xl font-bold text-accent">Usuários do Sistema</h3>
                            <p className="text-sm text-text-secondary">Adicione, edite ou remova técnicos e administradores.</p>
                        </div>
                        <Button onClick={() => handleOpenUserModal(null)}><PlusIcon className="w-5 h-5 mr-2"/> Novo Usuário</Button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-border">
                                <tr>
                                    <th className="p-3">Nome</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Setor</th>
                                    <th className="p-3">Tipo</th>
                                    <th className="p-3">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className="border-b border-border hover:bg-primary">
                                        <td className="p-3">{user.nome}</td>
                                        <td className="p-3">{user.email}</td>
                                        <td className="p-3">{user.setor}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.role === 'ADM' ? 'bg-accent text-white' : 'bg-secondary text-text-primary'}`}>{user.role}</span>
                                        </td>
                                        <td className="p-3">
                                            <Button variant="secondary" onClick={() => handleOpenUserModal(user)}><EditIcon className="w-4 h-4"/></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            <UserFormModal 
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
                user={editingUser}
            />
        </div>
    );
};

const UserFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (user: Omit<UsuarioTecnico, 'id'> | UsuarioTecnico) => void;
    user: UsuarioTecnico | null;
}> = ({ isOpen, onClose, onSave, user }) => {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        setor: '',
        role: 'Padrão' as UserRole
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                nome: user?.nome || '',
                email: user?.email || '',
                setor: user?.setor || '',
                role: user?.role || 'Padrão'
            });
        }
    }, [isOpen, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(user ? { ...formData, id: user.id } : formData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={user ? "Editar Usuário" : "Novo Usuário"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-text-primary text-sm font-bold mb-2">Nome</label>
                    <Input name="nome" value={formData.nome} onChange={handleChange} required />
                </div>
                 <div>
                    <label className="block text-text-primary text-sm font-bold mb-2">Email</label>
                    <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
                </div>
                 <div>
                    <label className="block text-text-primary text-sm font-bold mb-2">Setor</label>
                    <Input name="setor" value={formData.setor} onChange={handleChange} />
                </div>
                 <div>
                    <label className="block text-text-primary text-sm font-bold mb-2">Tipo</label>
                    <Select name="role" value={formData.role} onChange={handleChange}>
                        <option value="Padrão">Padrão</option>
                        <option value="ADM">ADM</option>
                    </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit"><SaveIcon className="w-5 h-5 mr-2"/> Salvar</Button>
                </div>
            </form>
        </Modal>
    );
};


const NewVisitModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (visitData: Omit<VisitaTecnica, 'id' | 'laudo_final' | 'criado_em' | 'tecnico'>) => void;
    user: UsuarioTecnico;
    clientes: Cliente[];
}> = ({ isOpen, onClose, onSave, user, clientes }) => {
    const [clienteId, setClienteId] = useState('');
    const [descricaoExtra, setDescricaoExtra] = useState('');
    const [dataInicio, setDataInicio] = useState('');
    const [status, setStatus] = useState<VisitStatus>(VisitStatus.Aberta);
    
    useEffect(() => {
        if(isOpen) {
            // Set default start date to now when modal opens
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setDataInicio(now.toISOString().slice(0, 16));
            setClienteId('');
            setDescricaoExtra('');
            setStatus(VisitStatus.Aberta);
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(!clienteId) {
            alert('Por favor, selecione um cliente.');
            return;
        }
        
        const selectedCliente = clientes.find(c => c.id === parseInt(clienteId, 10));
        if (!selectedCliente) return;

        onSave({
            usuario_id: user.id,
            cliente_id: parseInt(clienteId, 10),
            cliente: selectedCliente.nome_fantasia,
            descricao_extra: descricaoExtra,
            data_inicio: new Date(dataInicio).toISOString(),
            status: status,
        });
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Nova Visita Técnica">
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-text-primary text-sm font-bold mb-2" htmlFor="cliente">
                        Empresa
                    </label>
                    <Select id="cliente" value={clienteId} onChange={e => setClienteId(e.target.value)} required>
                        <option value="" disabled>Selecione um cliente</option>
                        {clientes.map(cliente => (
                            <option key={cliente.id} value={cliente.id}>{cliente.nome_fantasia}</option>
                        ))}
                    </Select>
                </div>
                 <div>
                    <label className="block text-text-primary text-sm font-bold mb-2" htmlFor="descricao">
                        Descrição Extra
                    </label>
                    <Textarea 
                        id="descricao" 
                        value={descricaoExtra} 
                        onChange={e => setDescricaoExtra(e.target.value)}
                        placeholder="Observações gerais sobre a visita (opcional)"
                        rows={3}
                    />
                </div>
                <div>
                    <label className="block text-text-primary text-sm font-bold mb-2" htmlFor="tecnico">
                        Técnico
                    </label>
                    <Input id="tecnico" type="text" value={user.nome} disabled />
                </div>
                 <div>
                    <label className="block text-text-primary text-sm font-bold mb-2" htmlFor="data_inicio">
                        Data/Hora de Início
                    </label>
                    <Input id="data_inicio" type="datetime-local" value={dataInicio} onChange={e => setDataInicio(e.target.value)} required />
                </div>
                <div>
                     <label className="block text-text-primary text-sm font-bold mb-2" htmlFor="status">
                        Status Inicial
                    </label>
                    <Select id="status" value={status} onChange={e => setStatus(e.target.value as VisitStatus)} required>
                        <option value={VisitStatus.Aberta}>Aberta (Iniciar Agora)</option>
                        <option value={VisitStatus.Agendada}>Agendada</option>
                    </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-border">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button type="submit">Criar Visita</Button>
                </div>
            </form>
        </Modal>
    )
}


// --- Main Dashboard Component ---

interface DashboardProps {
  user: UsuarioTecnico;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
    const [visitas, setVisitas] = useState<VisitaTecnica[]>([]);
    const [anotacoes, setAnotacoes] = useState<AnotacaoTecnica[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [tecnicos, setTecnicos] = useState<UsuarioTecnico[]>([]);

    const [selectedVisit, setSelectedVisit] = useState<VisitaTecnica | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
    
    const [isAnnotationModalOpen, setIsAnnotationModalOpen] = useState(false);
    const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);
    const [currentAnnotationType, setCurrentAnnotationType] = useState<AnnotationType | null>(null);
    const [editingAnnotation, setEditingAnnotation] = useState<AnotacaoTecnica | null>(null);

    const [view, setView] = useState<'dashboard' | 'settings'>('dashboard');
    const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([
        { name: 'Padrão TI Sênior', content: DEFAULT_AI_PROMPT_CONTENT }
    ]);
    const [dbStatus, setDbStatus] = useState<DbStatus>('checking');

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setDbStatus('checking');
        try {
            const isApiOnline = await api.checkApiHealth();
            if (!isApiOnline) {
                throw new Error("O servidor backend está offline.");
            }
            setDbStatus('online');

            const [usersData, clientsData] = await Promise.all([
                api.fetchUsers(), // Still mock for now
                api.fetchClients(), // Now fetches from real backend
            ]);
            setTecnicos(usersData);
            setClientes(clientsData);
            
            // Aqui você buscaria visitas e anotações se necessário na tela inicial
            setVisitas([]); // Começa vazio
            setAnotacoes([]);

        } catch (error) {
            console.error("Failed to load initial data", error);
            const errorMessage = error instanceof Error ? error.message : 'Falha ao conectar com o servidor.';
            setNotification({ type: 'error', message: errorMessage });
            setDbStatus('offline');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleSelectVisit = (visit: VisitaTecnica) => {
        setSelectedVisit(visit);
        setView('dashboard');
    };

    const handleBackToList = () => {
        setSelectedVisit(null);
    };
    
    const handleGenerateReport = async () => {
        if (!selectedVisit) return;
        setIsGeneratingReport(true);
        setNotification(null);

        try {
            const visitData = selectedVisit;
            const visitAnnotations = anotacoes.filter(a => a.visita_id === visitData.id);
            const reportSummary = await generateReportSummary(visitData, visitAnnotations);

            console.log("Enviando para o webhook N8N:", { visit: visitData, annotations: visitAnnotations, summary: reportSummary });
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const updatedVisit = { ...selectedVisit, laudo_final: `https://example.com/laudo-${selectedVisit.id}.pdf` };
            setVisitas(prevVisitas => prevVisitas.map(v => 
                v.id === selectedVisit.id ? updatedVisit : v
            ));
             setSelectedVisit(updatedVisit);

            setNotification({ type: 'success', message: 'Laudo gerado e enviado com sucesso!' });

        } catch (error) {
            console.error("Erro ao gerar laudo:", error);
            setNotification({ type: 'error', message: 'Falha ao gerar o laudo. Verifique sua chave de API e tente novamente.' });
        } finally {
            setIsGeneratingReport(false);
        }
    };

    const handleOpenAnnotationModal = (type: AnnotationType) => {
        setCurrentAnnotationType(type);
        setEditingAnnotation(null);
        setIsAnnotationModalOpen(true);
    };
    
    const handleEditAnnotation = (annotation: AnotacaoTecnica) => {
        setCurrentAnnotationType(annotation.tipo);
        setEditingAnnotation(annotation);
        setIsAnnotationModalOpen(true);
    };

    const handleSaveAnnotation = (newAnnotationData: Omit<AnotacaoTecnica, 'id' | 'visita_id' | 'data_hora'>, isDraft: boolean) => {
        if (!selectedVisit) return;

        setAnotacoes(prev => {
            const existingIndex = editingAnnotation ? prev.findIndex(a => a.id === editingAnnotation.id) : -1;

            if (existingIndex !== -1) {
                // Update existing
                const updatedAnnotations = [...prev];
                updatedAnnotations[existingIndex] = {
                    ...prev[existingIndex],
                    ...newAnnotationData,
                    data_hora: new Date().toISOString()
                };
                return updatedAnnotations;
            } else {
                // Add new
                const annotationToAdd: AnotacaoTecnica = {
                    ...newAnnotationData,
                    id: Date.now(),
                    visita_id: selectedVisit.id,
                    data_hora: new Date().toISOString()
                };
                return [...prev, annotationToAdd];
            }
        });
        
        setNotification({ type: 'success', message: `Anotação salva como ${isDraft ? 'rascunho' : 'final'}.` });
        setEditingAnnotation(null);
    };

     const handleSaveNewVisit = (visitData: Omit<VisitaTecnica, 'id' | 'laudo_final' | 'criado_em' | 'tecnico'>) => {
        const newVisit: VisitaTecnica = {
            ...visitData,
            id: Date.now(),
            laudo_final: null,
            criado_em: new Date().toISOString(),
            tecnico: tecnicos.find(t => t.id === visitData.usuario_id)
        };
        // Em uma app real, você chamaria: await api.createVisit(newVisit);
        // e depois atualizaria o estado, talvez buscando as visitas novamente.
        setVisitas(prev => [newVisit, ...prev]);
        setIsNewVisitModalOpen(false);
        setNotification({ type: 'success', message: 'Nova visita criada com sucesso!' });
    };

    const renderMainContent = () => {
         if (loading) {
            return <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>;
        }

        if (view === 'settings') {
            return <Settings 
                        onBack={() => setView('dashboard')} 
                        prompts={aiPrompts} 
                        setPrompts={setAiPrompts} 
                        setNotification={setNotification}
                        users={tecnicos}
                        onUsersUpdate={setTecnicos}
                    />
        }

        if (selectedVisit) {
             return <VisitDetails
                visit={selectedVisit}
                annotations={anotacoes.filter(a => a.visita_id === selectedVisit.id)}
                onBack={handleBackToList}
                onAddAnnotation={handleOpenAnnotationModal}
                onEditAnnotation={handleEditAnnotation}
                onGenerateReport={handleGenerateReport}
                isGeneratingReport={isGeneratingReport}
            />
        }

        return (
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Visitas Técnicas</h2>
                    <Button onClick={() => setIsNewVisitModalOpen(true)}><PlusIcon className="w-5 h-5 mr-2" /> Nova Visita</Button>
                </div>
                <div>
                    {visitas.length > 0 ? (
                         visitas.map(visit => (
                            <VisitCard key={visit.id} visit={visit} onSelect={() => handleSelectVisit(visit)} />
                        ))
                    ) : (
                        <Card className="p-6 text-center">
                            <h3 className="text-lg font-semibold text-text-primary">Nenhuma visita encontrada.</h3>
                            <p className="text-text-secondary mt-2">Crie uma nova visita para começar a registrar suas atividades.</p>
                             <Button onClick={() => setIsNewVisitModalOpen(true)} className="mt-4">
                                <PlusIcon className="w-5 h-5 mr-2" />
                                Criar Primeira Visita
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Header user={user} onLogout={onLogout} onNavigate={setView} dbStatus={dbStatus} />
             {notification && (
                <div className={`p-4 text-white text-center ${notification.type === 'success' ? 'bg-success' : 'bg-danger'}`}>
                   <div className="container mx-auto flex items-center justify-center gap-2">
                     {notification.type === 'success' ? <CheckCircleIcon className="w-5 h-5"/> : <XCircleIcon className="w-5 h-5"/>}
                    {notification.message}
                   </div>
                </div>
            )}
            <main className="flex-grow container mx-auto p-4 sm:p-6">
                {renderMainContent()}
            </main>
            <AnnotationModal 
                isOpen={isAnnotationModalOpen}
                onClose={() => setIsAnnotationModalOpen(false)}
                onSave={handleSaveAnnotation}
                annotationType={currentAnnotationType}
                existingAnnotation={editingAnnotation}
                aiPrompts={aiPrompts}
                setNotification={setNotification}
            />
             <NewVisitModal
                isOpen={isNewVisitModalOpen}
                onClose={() => setIsNewVisitModalOpen(false)}
                onSave={handleSaveNewVisit}
                user={user}
                clientes={clientes}
            />
        </div>
    );
};

export default Dashboard;
