# Configuração do Banco de Dados PostgreSQL

Este documento fornece as instruções para conectar a aplicação a um banco de dados PostgreSQL externo, seja localmente ou em produção.

## Variáveis de Ambiente

Para que o backend da aplicação se conecte corretamente ao banco de dados, você deve configurar as variáveis de ambiente necessárias. Crie um arquivo `.env` na raiz do projeto (ou configure as variáveis no seu ambiente de deploy, como o Coolify) com as seguintes chaves:

```env
# Endereço do servidor do banco de dados (ex: localhost, IP do servidor, ou nome do serviço Docker)
PG_HOST=db.example.com

# Porta na qual o PostgreSQL está rodando (padrão é 5432)
PG_PORT=5432

# Nome de usuário para acessar o banco de dados
PG_USER=seu_usuario

# Senha para o usuário do banco de dados
PG_PASSWORD=sua_senha_segura

# Nome do banco de dados a ser utilizado pela aplicação
PG_DATABASE=inside_notes_db
```

## Executando o Schema SQL

Após configurar a conexão, você precisa criar a estrutura de tabelas no banco de dados. Utilize o arquivo `schema.txt` fornecido na raiz do projeto.

**Importante:** Antes de executar o script, certifique-se de que o banco de dados (ex: `inside_notes_db`) já exista no seu servidor PostgreSQL.

Você pode executar este arquivo usando uma ferramenta de cliente PostgreSQL como `psql`, DBeaver, ou DataGrip.

### Exemplo usando `psql`

O `psql` é o cliente de linha de comando oficial do PostgreSQL.

1.  Navegue até o diretório raiz do projeto no seu terminal.
2.  Execute o seguinte comando, substituindo os placeholders pelas suas credenciais:

    ```bash
    psql -h SEU_HOST -p SEU_PORT -U SEU_USUARIO -d SEU_DATABASE -f ./schema.txt
    ```

    - `-h SEU_HOST`: O endereço do seu servidor de banco de dados.
    - `-p SEU_PORT`: A porta do servidor.
    - `-U SEU_USUARIO`: O seu nome de usuário.
    - `-d SEU_DATABASE`: O nome do banco de dados alvo.
    - `-f ./schema.txt`: O caminho para o arquivo de schema.

O comando irá solicitar sua senha e, em seguida, executará todos os comandos `CREATE TABLE` e `CREATE TYPE` no banco de dados especificado, deixando-o pronto para ser usado pela aplicação.
