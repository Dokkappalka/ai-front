import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import styles from './LoginPage.module.scss'
import { fetchAuth } from '../../api/fetchAuth';

const loginSchema = z.object({
    login: z.string().min(1, 'Поле обязательно'),
    password: z.string().min(1, 'Поле обязательно'),
})
type LoginFormData = z.infer<typeof loginSchema>


const LoginPage = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    })
    const onSubmit = (data: LoginFormData) => {
        authMutation.mutate(data)
    }

    const authMutation = fetchAuth()
          
    return (
        <div className={styles.container}>
            <div className={styles.formContainer}>
                <h1>Авторизация</h1>
                <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
                    <div className={styles.inputsContainer}>
                        <div className={styles.inputWrapper}>
                            <input
                                {...register('login')}
                                className={styles.input}
                                type="text"
                                placeholder="Login"
                            />
                            <p className={styles.error}>{errors.login ? errors.login.message : ' \b\b'}</p>
                        </div>
                        <div className={styles.inputWrapper}>
                            <input
                                {...register('password')}
                                className={styles.input}
                                type="password"
                                placeholder="Password"
                            />
                            <p className={styles.error}>{errors.password ? errors.password.message : ' \b\b'}</p>
                        </div>
                    </div>
                    <button disabled={authMutation.isPending} type="submit" className={styles.loginButton}>
                        Войти
                    </button>
                    <p>{authMutation.isPending ? 'Loading...' : ' \b\b'}</p>
                    <p className={styles.error}>{authMutation.isError ? authMutation.error.message : ' \b\b'}</p>
                </form>
            </div>
        </div>
    )
}

export default LoginPage